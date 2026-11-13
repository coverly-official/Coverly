import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

const VALID_TIERS = [
  "phone_verified",
  "email_verified",
  "document_verified",
  "registration_checked",
];

// POST /api/verifications/submit
router.post("/verifications/submit", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { business_id, verification_tier, documents } = req.body;

  if (!business_id || !verification_tier || !VALID_TIERS.includes(verification_tier)) {
    return sendError(
      res,
      `Business ID and a valid verification tier (${VALID_TIERS.join(", ")}) are required.`,
      400,
      "VALIDATION_FAILED"
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Check user is authorized member of the business
    if (!user.roles.includes("admin")) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("role_in_business")
        .eq("business_id", business_id)
        .eq("user_id", user.id)
        .single();

      if (!member || !["owner", "admin"].includes(member.role_in_business)) {
        return sendError(res, "Not authorized to submit verification for this business.", 403, "FORBIDDEN");
      }
    }

    // 2. Insert verification request
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
      return sendError(res, verError?.message || "Failed to submit verification.", 500, "DATABASE_ERROR");
    }

    // 3. Insert documents
    if (Array.isArray(documents) && documents.length > 0) {
      const docsPayload = documents.map((doc: any) => ({
        verification_id: verification.id,
        doc_type: doc.doc_type || "other",
        file_url: doc.file_url,
        file_key: doc.file_key || "doc",
      }));
      await insforge.database.from("verification_documents").insert(docsPayload);
    }

    return sendSuccess(res, verification, "Verification request submitted for compliance review.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit verification.", 500, "SERVER_ERROR");
  }
});

// GET /api/verifications/status/:businessId
router.get("/verifications/status/:businessId", authenticateUser, async (req, res) => {
  const { businessId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: verifications, error } = await insforge.database
      .from("supplier_verifications")
      .select(
        "id, business_id, verification_tier, status, review_notes, submitted_at, reviewed_at, verification_documents(id, doc_type, file_url, uploaded_at)"
      )
      .eq("business_id", businessId)
      .order("submitted_at", { ascending: false });

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, verifications || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch verification status.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/verifications
router.get("/admin/verifications", authenticateUser, requireAdmin, async (req, res) => {
  const { status = "pending" } = req.query as { status?: string };
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("supplier_verifications")
      .select(
        "id, business_id, verification_tier, status, review_notes, submitted_at, reviewed_at, businesses(id, name, slug, city, state, gstin, pan, verification_level), verification_documents(*)"
      )
      .order("submitted_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(50);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch verification queue.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/verifications/:id (Compliance Decision)
router.patch("/admin/verifications/:id", authenticateUser, requireAdmin, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { status, review_notes } = req.body;

  if (!status || !["approved", "rejected", "more_info_requested"].includes(status)) {
    return sendError(
      res,
      "Valid status (approved, rejected, or more_info_requested) is required.",
      400,
      "VALIDATION_FAILED"
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    // 1. Fetch verification
    const { data: existingVer, error: fetchErr } = await insforge.database
      .from("supplier_verifications")
      .select("id, business_id, verification_tier")
      .eq("id", id)
      .single();

    if (fetchErr || !existingVer) {
      return sendError(res, "Verification request not found.", 404, "NOT_FOUND");
    }

    // 2. Update record
    const { data: updatedVer, error: updateErr } = await insforge.database
      .from("supplier_verifications")
      .update({
        status,
        reviewer_id: user.id,
        review_notes: review_notes?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return sendError(res, updateErr.message, 500, "DATABASE_ERROR");

    // 3. Promote business tier if approved
    if (status === "approved") {
      await insforge.database
        .from("businesses")
        .update({
          verification_level: existingVer.verification_tier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingVer.business_id);
    }

    // 4. Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: user.id,
        action: `VERIFICATION_${status.toUpperCase()}`,
        target_type: "supplier_verification",
        target_id: id,
        metadata: {
          business_id: existingVer.business_id,
          tier: existingVer.verification_tier,
          review_notes,
        },
      },
    ]);

    // 5. Notify business owner
    const { data: ownerMember } = await insforge.database
      .from("business_members")
      .select("user_id")
      .eq("business_id", existingVer.business_id)
      .eq("role_in_business", "owner")
      .single();

    if (ownerMember?.user_id) {
      await insforge.database.from("notifications").insert([
        {
          user_id: ownerMember.user_id,
          title: `Verification Request ${status.replace("_", " ").toUpperCase()}`,
          message:
            status === "approved"
              ? `Congratulations! Your business has achieved ${existingVer.verification_tier.replace("_", " ")} badge.`
              : `Your verification submission was ${status}. Review notes: ${review_notes || "None provided."}`,
          link: `/supplier/verification`,
        },
      ]);
    }

    return sendSuccess(res, updatedVer, `Verification marked as ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update verification.", 500, "SERVER_ERROR");
  }
});

export default router;
