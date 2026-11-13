import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/notifications
router.get("/notifications", async (req, res) => {
  const { user_id } = req.query as { user_id?: string };

  if (!user_id) {
    return res.status(400).json({
      success: false,
      error: "User ID is required.",
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
    const { data, error } = await insforge.database
      .from("notifications")
      .select("id, title, message, link, is_read, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(30);

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
      error: err.message || "Failed to fetch notifications.",
    });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to update notification.",
    });
  }
});

export default router;
