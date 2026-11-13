import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// POST /api/verifications/submit
router.post("/verifications/submit", async (req, res) => {
  const {
    business_id,
    verification_tier,
    documents,
  } = req.body;

  const validTiers = ["phone_verified", "email_verified", "document_verified", "registration_checked"];

  if (!business_id || !verification_tier || !validTiers.includes(verification_tier)) {
    return res.status(400).json({
      success: false,
      error: "Business ID and a valid verification tier are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    // 1. Insert verification request
    const { data: verification, error: verError } = await insforge.database
      .from("supplier_verifications")
      .insert([
        {
          business_id,
          verification_tier,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (verError || !verification) {
      return res.status(500).json({ success: false, error: verError?.message || "Failed to submit verification." });
    }

    // 2. Insert documents if provided
    if (Array.isArray(documents) && documents.length > 0) {
      const docsPayload = documents.map((doc: any) => ({
        verification_id: verification.id,
        doc_type: doc.doc_type || "other",
        file_url: doc.file_url,
        file_key: doc.file_key || "doc",
      }));
      await insforge.database.from("verification_documents").insert(docsPayload);
    }

    return res.status(201).json({
      success: true,
      message: "Verification submitted for administrative review.",
      data: verification,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to submit verification.",
    });
  }
});

// GET /api/admin/verifications
router.get("/admin/verifications", async (req, res) => {
  const { status = "pending" } = req.query as { status?: string };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("supplier_verifications")
      .select("id, business_id, verification_tier, status, review_notes, submitted_at, businesses(name, city, gstin, pan), verification_documents(*)")
      .eq("status", status)
      .order("submitted_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch verification queue.",
    });
  }
});

// PATCH /api/admin/verifications/:id
router.patch("/admin/verifications/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reviewer_id, review_notes } = req.body;

  if (!status || !["approved", "rejected", "more_info_requested"].includes(status) || !reviewer_id) {
    return res.status(400).json({
      success: false,
      error: "Status (approved/rejected/more_info_requested) and reviewer_id are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    // 1. Update verification record
    const { data: verRecord, error: verError } = await insforge.database
      .from("supplier_verifications")
      .update({
        status,
        reviewer_id,
        review_notes: review_notes?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (verError || !verRecord) {
      return res.status(500).json({ success: false, error: verError?.message || "Failed to update verification." });
    }

    // 2. If approved, update business verification_level
    if (status === "approved") {
      await insforge.database
        .from("businesses")
        .update({
          verification_level: verRecord.verification_tier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verRecord.business_id);
    }

    // 3. Log audit event
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: reviewer_id,
        action: `VERIFICATION_${status.toUpperCase()}`,
        target_type: "supplier_verification",
        target_id: id,
        metadata: {
          business_id: verRecord.business_id,
          tier: verRecord.verification_tier,
          notes: review_notes,
        },
      },
    ]);

    return res.json({
      success: true,
      message: `Verification marked as ${status}.`,
      data: verRecord,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to process verification decision.",
    });
  }
});

export default router;
