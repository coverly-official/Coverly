import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireAdmin } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

const VALID_TARGET_TYPES = ["product", "business", "rfq", "user"];
const VALID_REPORT_STATUSES = ["pending", "investigating", "resolved", "dismissed"];

// POST /api/reports (Submit a Complaint or Fraud Report)
router.post("/reports", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { target_type, target_id, reason } = req.body;

  if (!target_type || !VALID_TARGET_TYPES.includes(target_type) || !target_id || !reason?.trim()) {
    return sendError(
      res,
      `target_type (${VALID_TARGET_TYPES.join(", ")}), target_id, and reason are required.`,
      400,
      "VALIDATION_FAILED"
    );
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: report, error } = await insforge.database
      .from("reports")
      .insert([
        {
          reporter_id: user.id,
          target_type,
          target_id,
          reason: reason.trim(),
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, report, "Report submitted for compliance review.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit report.", 500, "SERVER_ERROR");
  }
});

// GET /api/admin/reports (List Reports Queue)
router.get("/admin/reports", authenticateUser, requireAdmin, async (req, res) => {
  const { status = "pending", target_type } = req.query as { status?: string; target_type?: string };

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("reports")
      .select("id, reporter_id, target_type, target_id, reason, status, admin_notes, created_at, users(full_name, email)")
      .order("created_at", { ascending: false });

    if (status && status !== "all" && VALID_REPORT_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    if (target_type && VALID_TARGET_TYPES.includes(target_type)) {
      query = query.eq("target_type", target_type);
    }

    const { data, error } = await query.limit(50);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch reports.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/admin/reports/:id (Resolve or Dismiss Report)
router.patch("/admin/reports/:id", authenticateUser, requireAdmin, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status || !VALID_REPORT_STATUSES.includes(status)) {
    return sendError(res, `Valid status (${VALID_REPORT_STATUSES.join(", ")}) is required.`, 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: updatedReport, error } = await insforge.database
      .from("reports")
      .update({
        status,
        admin_notes: admin_notes?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Audit Log
    await insforge.database.from("admin_audit_logs").insert([
      {
        admin_id: user.id,
        action: `REPORT_${status.toUpperCase()}`,
        target_type: "report",
        target_id: id,
        metadata: { admin_notes },
      },
    ]);

    return sendSuccess(res, updatedReport, `Report marked as ${status}.`);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update report.", 500, "SERVER_ERROR");
  }
});

export default router;
