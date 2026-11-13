import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// GET /api/notifications
router.get("/notifications", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { limit = "30", unread_only } = req.query as { limit?: string; unread_only?: string };

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("notifications")
      .select("id, title, message, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit, 10) || 30);

    if (unread_only === "true") {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch notifications.", 500, "SERVER_ERROR");
  }
});

// GET /api/notifications/unread-count
router.get("/notifications/unread-count", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { count, error } = await insforge.database
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, { unreadCount: count || 0 });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch unread count.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/notifications/mark-all-read
router.patch("/notifications/mark-all-read", authenticateUser, async (req, res) => {
  const user = req.user!;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { error } = await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, null, "All notifications marked as read.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to mark all notifications read.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data, "Notification marked as read.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update notification.", 500, "SERVER_ERROR");
  }
});

// DELETE /api/notifications/:id
router.delete("/notifications/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { error } = await insforge.database
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, null, "Notification deleted.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to delete notification.", 500, "SERVER_ERROR");
  }
});

export default router;
