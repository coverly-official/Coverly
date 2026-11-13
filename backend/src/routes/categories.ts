import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/categories
router.get("/categories", async (_req, res) => {
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data, error } = await insforge.database
      .from("product_categories")
      .select("id, label, unit, default_qty, created_at")
      .order("created_at", { ascending: true });

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
      error: err.message || "Failed to fetch categories.",
    });
  }
});

// GET /api/categories/:id
router.get("/categories/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: category, error } = await insforge.database
      .from("product_categories")
      .select("id, label, unit, default_qty, created_at")
      .eq("id", id)
      .single();

    if (error || !category) {
      return res.status(404).json({
        success: false,
        error: "Category not found.",
      });
    }

    const { data: products } = await insforge.database
      .from("products")
      .select("id, title, slug, moq, unit, indicative_price, created_at")
      .eq("category_id", id)
      .eq("is_active", true)
      .limit(20);

    return res.json({
      success: true,
      data: {
        ...category,
        products: products || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch category details.",
    });
  }
});

export default router;
