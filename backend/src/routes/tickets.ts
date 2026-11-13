import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// POST /api/tickets
router.post("/tickets", async (req, res) => {
  const { user_id, subject, category = "order", priority = "medium", message } = req.body;

  if (!user_id || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      error: "User ID, subject, and message are required.",
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
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: ticket, error: ticketError } = await insforge.database
      .from("support_tickets")
      .insert([
        {
          ticket_number: ticketNumber,
          user_id,
          subject: subject.trim(),
          category,
          priority,
          status: "open",
        },
      ])
      .select()
      .single();

    if (ticketError || !ticket) {
      return res.status(500).json({ success: false, error: ticketError?.message || "Failed to create support ticket." });
    }

    // Insert first message
    await insforge.database.from("ticket_messages").insert([
      {
        ticket_id: ticket.id,
        sender_id: user_id,
        message: message.trim(),
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Ticket submitted successfully.",
      data: ticket,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to submit ticket.",
    });
  }
});

// GET /api/tickets
router.get("/tickets", async (req, res) => {
  const { user_id, status } = req.query as { user_id?: string; status?: string };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let query = insforge.database
      .from("support_tickets")
      .select("id, ticket_number, user_id, subject, category, priority, status, created_at, users(full_name, email)")
      .order("created_at", { ascending: false });

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(50);

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
      error: err.message || "Failed to fetch tickets.",
    });
  }
});

export default router;
