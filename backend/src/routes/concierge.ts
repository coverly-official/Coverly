import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

router.post("/concierge-leads", async (req, res) => {
  const { name, business, phone, category, requirement } = req.body as {
    name?: string;
    business?: string;
    phone?: string;
    category?: string;
    requirement?: string;
  };

  if (!name?.trim() || !business?.trim() || !phone?.trim() || !requirement?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Name, business, phone, and requirement are required.",
    });
  }

  if (!/^[0-9+\s-]{10,14}$/.test(phone.trim())) {
    return res.status(400).json({
      success: false,
      error: "Enter a valid 10-digit mobile number.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error:
        "InsForge database is not configured. Set INSFORGE_BASE_URL and INSFORGE_ANON_KEY or INSFORGE_API_KEY.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("concierge_leads")
      .insert([
        {
          name: name.trim(),
          business: business.trim(),
          phone: phone.trim(),
          category: category?.trim() || "cotton-tshirts",
          requirement: requirement.trim(),
          status: "new",
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Concierge request logged successfully.",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to save concierge lead.",
    });
  }
});

router.get("/concierge-leads", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge database is not configured.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("concierge_leads")
      .select("id, name, business, phone, category, requirement, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, leads: data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch leads.",
    });
  }
});

export default router;
