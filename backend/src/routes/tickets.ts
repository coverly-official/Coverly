import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

const VALID_CATEGORIES = ["order", "payment", "verification", "listing", "account", "other"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];

// POST /api/tickets (Create Ticket)
router.post("/tickets", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { subject, category = "order", priority = "medium", message } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    return sendError(res, "Subject and message are required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Insert Ticket
    const { data: ticket, error: ticketError } = await insforge.database
      .from("support_tickets")
      .insert([
        {
          ticket_number: ticketNumber,
          user_id: user.id,
          subject: subject.trim(),
          category: VALID_CATEGORIES.includes(category) ? category : "other",
          priority: VALID_PRIORITIES.includes(priority) ? priority : "medium",
          status: "open",
        },
      ])
      .select()
      .single();

    if (ticketError || !ticket) {
      return sendError(res, ticketError?.message || "Failed to create support ticket.", 500, "DATABASE_ERROR");
    }

    // 2. Insert First Message
    await insforge.database.from("ticket_messages").insert([
      {
        ticket_id: ticket.id,
        sender_id: user.id,
        message: message.trim(),
        is_internal: false,
      },
    ]);

    return sendSuccess(res, ticket, "Support ticket created successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit ticket.", 500, "SERVER_ERROR");
  }
});

// GET /api/tickets (List Tickets)
router.get("/tickets", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { status, category } = req.query as { status?: string; category?: string };

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    let query = insforge.database
      .from("support_tickets")
      .select("id, ticket_number, user_id, subject, category, priority, status, created_at, updated_at, users(full_name, email)")
      .order("updated_at", { ascending: false });

    // Non-admins only see their own tickets
    if (!user.roles.includes("admin") && !user.roles.includes("support_admin")) {
      query = query.eq("user_id", user.id);
    }

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.limit(50);
    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, data || []);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch tickets.", 500, "SERVER_ERROR");
  }
});

// GET /api/tickets/:id (Ticket Details & Message Thread)
router.get("/tickets/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: ticket, error: ticketErr } = await insforge.database
      .from("support_tickets")
      .select("id, ticket_number, user_id, subject, category, priority, status, created_at, updated_at, users(full_name, email)")
      .eq("id", id)
      .single();

    if (ticketErr || !ticket) {
      return sendError(res, "Ticket not found.", 404, "NOT_FOUND");
    }

    const isAdmin = user.roles.includes("admin") || user.roles.includes("support_admin");
    if (ticket.user_id !== user.id && !isAdmin) {
      return sendError(res, "Not authorized to view this ticket.", 403, "FORBIDDEN");
    }

    // Fetch message thread
    const { data: messages } = await insforge.database
      .from("ticket_messages")
      .select("id, ticket_id, sender_id, message, is_internal, created_at, users(full_name, email)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    return sendSuccess(res, {
      ...ticket,
      messages: messages || [],
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to load ticket details.", 500, "SERVER_ERROR");
  }
});

// POST /api/tickets/:id/reply (Send Message Reply)
router.post("/tickets/:id/reply", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { message, is_internal = false } = req.body;

  if (!message?.trim()) {
    return sendError(res, "Message cannot be empty.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: ticket } = await insforge.database
      .from("support_tickets")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (!ticket) return sendError(res, "Ticket not found.", 404, "NOT_FOUND");

    const isAdmin = user.roles.includes("admin") || user.roles.includes("support_admin");
    if (ticket.user_id !== user.id && !isAdmin) {
      return sendError(res, "Not authorized to reply to this ticket.", 403, "FORBIDDEN");
    }

    // Insert Message
    const { data: newMsg, error } = await insforge.database
      .from("ticket_messages")
      .insert([
        {
          ticket_id: id,
          sender_id: user.id,
          message: message.trim(),
          is_internal: Boolean(is_internal && isAdmin),
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    // Update ticket updated_at and status
    const newStatus = isAdmin ? "waiting_on_customer" : "in_progress";
    await insforge.database
      .from("support_tickets")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    // Notify counterpart
    const targetUserId = isAdmin ? ticket.user_id : null;
    if (targetUserId) {
      await insforge.database.from("notifications").insert([
        {
          user_id: targetUserId,
          title: "New Support Reply",
          message: `Support desk replied to your ticket.`,
          link: `/support/${id}`,
        },
      ]);
    }

    return sendSuccess(res, newMsg, "Reply sent successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to send reply.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/tickets/:id/status (Update Ticket Status or Priority)
router.patch("/tickets/:id/status", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { status, priority } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data: ticket } = await insforge.database
      .from("support_tickets")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!ticket) return sendError(res, "Ticket not found.", 404, "NOT_FOUND");

    const isAdmin = user.roles.includes("admin") || user.roles.includes("support_admin");

    // Regular users can only close their own open ticket
    if (!isAdmin) {
      if (ticket.user_id !== user.id || status !== "closed") {
        return sendError(res, "You can only close your own support ticket.", 403, "FORBIDDEN");
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status && VALID_STATUSES.includes(status)) updatePayload.status = status;
    if (priority && VALID_PRIORITIES.includes(priority) && isAdmin) updatePayload.priority = priority;

    const { data: updatedTicket, error } = await insforge.database
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");

    return sendSuccess(res, updatedTicket, "Ticket status updated.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update ticket.", 500, "SERVER_ERROR");
  }
});

export default router;
