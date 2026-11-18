import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getInsForgeClient } from "../../lib/insforge.js";
import { isValidProviderCode } from "./payment.validation.js";
import { applyVerifiedPaymentState, getPaymentProvider } from "./payment.service.js";
import { sumPaise, type PaymentLifecycleStatus } from "./payment.interface.js";

/**
 * Provider Webhook Receiver:
 * - Verifies cryptographic signature per provider specification
 * - Rejects invalid signatures (HTTP 401) and records rejected attempt
 * - Deduplicates replay/duplicate webhooks via UNIQUE (provider, provider_event_id)
 * - Processes verified payment & refund events idempotently
 */
export async function handleProviderWebhook(req: Request, res: Response) {
  const providerParam = String(req.params.provider || "").trim().toLowerCase();
  if (!isValidProviderCode(providerParam)) {
    return res.status(400).json({ success: false, error: "Unknown payment gateway provider." });
  }

  const rawBody =
    typeof (req as any).rawBody === "string"
      ? (req as any).rawBody
      : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body || {});
  const parsedBody =
    req.body && typeof req.body === "object"
      ? req.body
      : (() => {
          try {
            return JSON.parse(rawBody);
          } catch {
            return {};
          }
        })();

  const payloadHash = crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
  const adapter = getPaymentProvider(providerParam);

  const result = await adapter.processWebhook({
    rawBody,
    parsedBody,
    headers: req.headers,
  });

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({ success: false, error: "Database unavailable." });
  }

  // 1. Reject invalid signature immediately & log audit event
  if (!result.signatureValid) {
    try {
      await insforge.database.from("payment_webhook_events").insert([
        {
          provider: providerParam,
          provider_event_id: `invalid_${payloadHash.slice(0, 24)}_${Date.now()}`,
          event_type: result.eventType || "invalid_signature",
          signature_valid: false,
          payload_hash: payloadHash,
          processing_status: "rejected_invalid_signature",
          error_message: result.error || "Invalid webhook signature",
        },
      ]);
    } catch {}

    return res.status(401).json({
      success: false,
      error: result.error || "Webhook signature verification failed.",
      code: "INVALID_WEBHOOK_SIGNATURE",
    });
  }

  // 2. Duplicate / Replay Event Check (idempotent via UNIQUE (provider, provider_event_id))
  const { data: existingEvent } = await insforge.database
    .from("payment_webhook_events")
    .select("id, processing_status")
    .eq("provider", providerParam)
    .eq("provider_event_id", result.providerEventId)
    .single();

  if (existingEvent) {
    return res.status(200).json({
      success: true,
      duplicate_ignored: true,
      provider_event_id: result.providerEventId,
      message: "Webhook event already processed.",
    });
  }

  // 3. Insert verified webhook event lock row
  const { data: insertedEvent, error: insertErr } = await insforge.database
    .from("payment_webhook_events")
    .insert([
      {
        provider: providerParam,
        provider_event_id: result.providerEventId,
        event_type: result.eventType,
        signature_valid: true,
        payload_hash: payloadHash,
        processing_status: "received",
      },
    ])
    .select("id")
    .single();

  if (insertErr) {
    // Unique constraint race condition -> treat cleanly as duplicate ignored
    if (String(insertErr.message || "").toLowerCase().includes("duplicate") || insertErr.code === "23505") {
      return res.status(200).json({
        success: true,
        duplicate_ignored: true,
        provider_event_id: result.providerEventId,
      });
    }
    return res.status(500).json({ success: false, error: "Failed to persist webhook event." });
  }

  try {
    // 4. Locate matching payment by payment_reference or provider_order_id or provider_payment_id
    let payment: any = null;
    if (result.paymentReference) {
      const { data } = await insforge.database
        .from("payments")
        .select("*")
        .eq("payment_reference", result.paymentReference)
        .single();
      payment = data;
    }
    if (!payment && result.providerOrderId) {
      const { data } = await insforge.database
        .from("payments")
        .select("*")
        .eq("provider_order_id", result.providerOrderId)
        .single();
      payment = data;
    }
    if (!payment && result.providerPaymentId) {
      const { data } = await insforge.database
        .from("payments")
        .select("*")
        .eq("provider_payment_id", result.providerPaymentId)
        .single();
      payment = data;
    }

    // 5. Apply payment status update if applicable
    if (payment && result.mappedStatus) {
      await applyVerifiedPaymentState({
        payment,
        targetStatus: result.mappedStatus,
        source: "webhook",
        providerOrderId: result.providerOrderId,
        providerPaymentId: result.providerPaymentId,
        gatewayFeePaise: result.gatewayFeePaise,
        failureReason: result.failureReason,
      });
    }

    // 6. Apply refund status update if applicable
    if (result.refundId && result.refundStatus) {
      const { data: refundRow } = await insforge.database
        .from("payment_refunds")
        .select("*")
        .or(`provider_refund_id.eq.${result.refundId},refund_reference.eq.${result.refundId}`)
        .single();

      if (refundRow) {
        const nowIso = new Date().toISOString();
        await insforge.database
          .from("payment_refunds")
          .update({
            status: result.refundStatus,
            processed_at: result.refundStatus === "SUCCESS" ? nowIso : refundRow.processed_at,
            updated_at: nowIso,
          })
          .eq("id", refundRow.id);

        if (result.refundStatus === "SUCCESS" && refundRow.status !== "SUCCESS" && payment) {
          const nextRefunded = sumPaise(Number(payment.refunded_paise || 0), Number(refundRow.amount_paise));
          const nextStatus: PaymentLifecycleStatus =
            nextRefunded >= Number(payment.amount_paise) ? "REFUNDED" : "PARTIALLY_REFUNDED";
          await insforge.database
            .from("payments")
            .update({ status: nextStatus, refunded_paise: nextRefunded, updated_at: nowIso })
            .eq("id", payment.id);
        }
      }
    }

    await insforge.database
      .from("payment_webhook_events")
      .update({
        processing_status: "processed",
        payment_id: payment?.id || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", insertedEvent.id);

    return res.status(200).json({
      success: true,
      processed: true,
      provider_event_id: result.providerEventId,
    });
  } catch (err: any) {
    await insforge.database
      .from("payment_webhook_events")
      .update({
        processing_status: "failed",
        error_message: err?.message || "Webhook processing error",
      })
      .eq("id", insertedEvent.id);

    return res.status(500).json({ success: false, error: "Webhook processing failed." });
  }
}
