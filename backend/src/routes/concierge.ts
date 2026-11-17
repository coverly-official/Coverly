import { Router, type Request, type Response } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// Handle both /concierge-leads and /enquiries
const handleCreateEnquiry = async (req: Request, res: Response) => {
  const {
    name,
    business,
    phone,
    email,
    category,
    requirement,
    product_title,
    product_id,
    supplier_business_id,
    quantity,
    unit,
    target_price,
    city,
  } = req.body as {
    name?: string;
    business?: string;
    phone?: string;
    email?: string;
    category?: string;
    requirement?: string;
    product_title?: string;
    product_id?: string;
    supplier_business_id?: string;
    quantity?: string | number;
    unit?: string;
    target_price?: string | number;
    city?: string;
  };

  if (!name?.trim() || !phone?.trim() || !requirement?.trim()) {
    return sendError(
      res,
      "Full name, contact phone number, and requirement details are required.",
      400,
      "VALIDATION_FAILED"
    );
  }

  // Basic Indian phone validation (10 to 14 digits allowing +91)
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  if (cleanPhone.length < 10) {
    return sendError(res, "Please enter a valid 10-digit mobile number.", 400, "VALIDATION_FAILED");
  }

  // Optional email format validation
  if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return sendError(res, "Please enter a valid email address.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "InsForge database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    let resolvedSupplierId = supplier_business_id || null;
    let resolvedProductTitle = product_title || null;

    // If product_id was passed, look up product and resolve supplier_business_id
    if (product_id) {
      const { data: prod } = await insforge.database
        .from("products")
        .select("id, title, business_id, indicative_price, unit")
        .eq("id", product_id)
        .single();

      if (prod) {
        resolvedSupplierId = resolvedSupplierId || prod.business_id;
        resolvedProductTitle = resolvedProductTitle || prod.title;
      }
    }

    // Compile structured requirement string for full legacy & audit compatibility
    const requirementDetails = [
      requirement.trim(),
      resolvedProductTitle ? `Product: ${resolvedProductTitle.trim()}` : null,
      quantity ? `Quantity Needed: ${quantity} ${unit || "units"}` : null,
      target_price ? `Target Price: ₹${target_price}` : null,
      city ? `Delivery City: ${city.trim()}` : null,
      email ? `Buyer Email: ${email.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const businessName = business?.trim() || "Independent Buyer / Wholesale Trader";
    const categoryName = category?.trim() || "General Procurement";

    // 1. Insert enquiry into concierge_leads
    const { data: enquiry, error: insertError } = await insforge.database
      .from("concierge_leads")
      .insert([
        {
          name: name.trim(),
          business: businessName,
          phone: cleanPhone,
          email: email?.trim() || null,
          category: categoryName,
          requirement: requirementDetails,
          product_id: product_id || null,
          supplier_business_id: resolvedSupplierId,
          target_quantity: quantity ? Number(quantity) : null,
          target_price: target_price ? Number(target_price) : null,
          delivery_city: city?.trim() || null,
          status: "new",
        },
      ])
      .select()
      .single();

    if (insertError || !enquiry) {
      return sendError(res, insertError?.message || "Failed to submit enquiry.", 500, "DATABASE_ERROR");
    }

    // 2. Real-time Notification Trigger:
    // If targeted at a specific wholesaler, notify their team members!
    if (resolvedSupplierId) {
      const { data: members } = await insforge.database
        .from("business_members")
        .select("user_id")
        .eq("business_id", resolvedSupplierId);

      if (members && members.length > 0) {
        const notifPayload = members.map((m: any) => ({
          user_id: m.user_id,
          title: "New Sourcing Enquiry Received",
          message: `${name.trim()} submitted an enquiry for ${resolvedProductTitle || "your products"}: "${requirement.trim().slice(0, 100)}..."`,
          link: "/supplier/rfqs",
        }));
        await insforge.database.from("notifications").insert(notifPayload);
      }
    } else {
      // If general broadcast enquiry, notify platform admins
      const { data: adminRoles } = await insforge.database
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(3);

      if (adminRoles && adminRoles.length > 0) {
        const adminNotifs = adminRoles.map((a: any) => ({
          user_id: a.user_id,
          title: "New Broadcast Concierge Lead",
          message: `${name.trim()} posted sourcing requirement in ${categoryName}: "${requirement.trim().slice(0, 80)}..."`,
          link: "/admin/rfqs",
        }));
        await insforge.database.from("notifications").insert(adminNotifs);
      }
    }

    return sendSuccess(
      res,
      enquiry,
      "Your procurement enquiry has been submitted. A supplier representative will reach out shortly.",
      201
    );
  } catch (err: any) {
    return sendError(res, err.message || "Failed to submit enquiry.", 500, "SERVER_ERROR");
  }
};

// Mount both paths
router.post("/concierge-leads", handleCreateEnquiry);
router.post("/enquiries", handleCreateEnquiry);

// GET /api/concierge-leads and /api/enquiries (Admin and Internal Fetch)
const handleGetEnquiries = async (req: Request, res: Response) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "InsForge database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data, error } = await insforge.database
      .from("concierge_leads")
      .select("id, name, business, phone, email, category, requirement, product_id, supplier_business_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

    return sendSuccess(res, { leads: data || [] });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch leads.", 500, "SERVER_ERROR");
  }
};

router.get("/concierge-leads", handleGetEnquiries);
router.get("/enquiries", handleGetEnquiries);

export default router;
