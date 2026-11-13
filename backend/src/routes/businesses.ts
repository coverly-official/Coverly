import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireBusinessMember } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// GET /api/businesses/:id
router.get("/businesses/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();

  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: business, error } = await insforge.database
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !business) {
      return sendError(res, "Business not found.", 404, "NOT_FOUND");
    }

    // Role-specific profile
    let specificProfile: any = null;
    if (business.business_type === "buyer") {
      const { data } = await insforge.database
        .from("buyer_profiles")
        .select("*")
        .eq("business_id", id)
        .single();
      specificProfile = data;
    } else if (["manufacturer", "wholesaler", "distributor"].includes(business.business_type)) {
      const { data } = await insforge.database
        .from("supplier_profiles")
        .select("*")
        .eq("business_id", id)
        .single();
      specificProfile = data;
    } else if (business.business_type === "service_provider") {
      const { data } = await insforge.database
        .from("service_provider_profiles")
        .select("*")
        .eq("business_id", id)
        .single();
      specificProfile = data;
    }

    return sendSuccess(res, {
      ...business,
      profile: specificProfile,
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch business details.", 500, "SERVER_ERROR");
  }
});

// PATCH /api/businesses/:id (Update Profile)
router.patch(
  "/businesses/:id",
  authenticateUser,
  requireBusinessMember(["owner", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      legal_name,
      gstin,
      pan,
      city,
      state,
      pincode,
      address,
      phone,
      email,
      website,
      // supplier specifics
      factory_size_sqft,
      production_capacity_monthly,
      export_ready,
      certifications,
      lead_time_days,
      // buyer specifics
      annual_sourcing_budget,
      primary_categories,
    } = req.body;

    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (name?.trim()) updatePayload.name = name.trim();
      if (legal_name !== undefined) updatePayload.legal_name = legal_name ? legal_name.trim() : null;
      if (gstin !== undefined) updatePayload.gstin = gstin ? gstin.trim().toUpperCase() : null;
      if (pan !== undefined) updatePayload.pan = pan ? pan.trim().toUpperCase() : null;
      if (city?.trim()) updatePayload.city = city.trim();
      if (state?.trim()) updatePayload.state = state.trim();
      if (pincode?.trim()) updatePayload.pincode = pincode.trim();
      if (address !== undefined) updatePayload.address = address ? address.trim() : null;
      if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
      if (email !== undefined) updatePayload.email = email ? email.trim() : null;
      if (website !== undefined) updatePayload.website = website ? website.trim() : null;

      // Update business entity
      const { data: updatedBusiness, error: busError } = await insforge.database
        .from("businesses")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (busError) {
        return sendError(res, busError.message, 500, "DATABASE_ERROR");
      }

      // Update role-specific profile
      if (["manufacturer", "wholesaler", "distributor"].includes(updatedBusiness.business_type)) {
        const suppPayload: Record<string, any> = {};
        if (factory_size_sqft !== undefined) suppPayload.factory_size_sqft = factory_size_sqft;
        if (production_capacity_monthly !== undefined) suppPayload.production_capacity_monthly = production_capacity_monthly;
        if (export_ready !== undefined) suppPayload.export_ready = Boolean(export_ready);
        if (certifications !== undefined) suppPayload.certifications = certifications;
        if (lead_time_days !== undefined) suppPayload.lead_time_days = lead_time_days;

        if (Object.keys(suppPayload).length > 0) {
          await insforge.database
            .from("supplier_profiles")
            .update(suppPayload)
            .eq("business_id", id);
        }
      } else if (updatedBusiness.business_type === "buyer") {
        const buyerPayload: Record<string, any> = {};
        if (annual_sourcing_budget !== undefined) buyerPayload.annual_sourcing_budget = annual_sourcing_budget;
        if (primary_categories !== undefined) buyerPayload.primary_categories = primary_categories;

        if (Object.keys(buyerPayload).length > 0) {
          await insforge.database
            .from("buyer_profiles")
            .update(buyerPayload)
            .eq("business_id", id);
        }
      }

      return sendSuccess(res, updatedBusiness, "Business profile updated successfully.");
    } catch (err: any) {
      return sendError(res, err.message || "Failed to update business profile.", 500, "SERVER_ERROR");
    }
  }
);

// GET /api/businesses/:id/members
router.get(
  "/businesses/:id/members",
  authenticateUser,
  requireBusinessMember(["owner", "admin", "viewer", "sales", "procurement"]),
  async (req, res) => {
    const { id } = req.params;
    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      const { data: members, error } = await insforge.database
        .from("business_members")
        .select("id, role_in_business, created_at, users(id, email, full_name, avatar_url)")
        .eq("business_id", id);

      if (error) {
        return sendError(res, error.message, 500, "DATABASE_ERROR");
      }

      return sendSuccess(res, members || []);
    } catch (err: any) {
      return sendError(res, err.message || "Failed to fetch members.", 500, "SERVER_ERROR");
    }
  }
);

// POST /api/businesses/:id/members (Add Team Member)
router.post(
  "/businesses/:id/members",
  authenticateUser,
  requireBusinessMember(["owner", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { user_email, role_in_business = "viewer" } = req.body;

    const validRoles = ["owner", "admin", "sales", "procurement", "viewer"];
    if (!user_email?.trim() || !validRoles.includes(role_in_business)) {
      return sendError(res, "Valid user email and permitted role_in_business are required.", 400, "VALIDATION_FAILED");
    }

    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      // 1. Locate user by email
      const { data: userRecord } = await insforge.database
        .from("users")
        .select("id, email, full_name")
        .eq("email", user_email.trim().toLowerCase())
        .single();

      if (!userRecord) {
        return sendError(res, "No registered user found with this email address.", 404, "USER_NOT_FOUND");
      }

      // 2. Check if already a member
      const { data: existingMember } = await insforge.database
        .from("business_members")
        .select("id")
        .eq("business_id", id)
        .eq("user_id", userRecord.id)
        .single();

      if (existingMember) {
        return sendError(res, "This user is already a member of this business.", 409, "MEMBER_EXISTS");
      }

      // 3. Insert membership
      const { data: newMember, error } = await insforge.database
        .from("business_members")
        .insert([
          {
            business_id: id,
            user_id: userRecord.id,
            role_in_business,
          },
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 500, "DATABASE_ERROR");
      }

      return sendSuccess(res, newMember, "Team member added successfully.", 201);
    } catch (err: any) {
      return sendError(res, err.message || "Failed to add member.", 500, "SERVER_ERROR");
    }
  }
);

// DELETE /api/businesses/:id/members/:memberId
router.delete(
  "/businesses/:id/members/:memberId",
  authenticateUser,
  requireBusinessMember(["owner", "admin"]),
  async (req, res) => {
    const { id, memberId } = req.params;
    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      const { error } = await insforge.database
        .from("business_members")
        .delete()
        .eq("id", memberId)
        .eq("business_id", id);

      if (error) {
        return sendError(res, error.message, 500, "DATABASE_ERROR");
      }

      return sendSuccess(res, null, "Member removed successfully.");
    } catch (err: any) {
      return sendError(res, err.message || "Failed to remove member.", 500, "SERVER_ERROR");
    }
  }
);

export default router;
