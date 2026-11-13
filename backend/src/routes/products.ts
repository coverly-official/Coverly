import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";

const router = Router();

// GET /api/products
router.get("/products", async (req, res) => {
  const { category, search, minMoq, maxMoq, sort } = req.query as {
    category?: string;
    search?: string;
    minMoq?: string;
    maxMoq?: string;
    sort?: string;
  };

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    let query = insforge.database
      .from("products")
      .select("id, business_id, category_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, created_at, businesses(name, city, verification_level)")
      .eq("is_active", true);

    if (category?.trim()) {
      query = query.eq("category_id", category.trim());
    }

    if (search?.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    if (minMoq) {
      query = query.gte("moq", Number.parseInt(minMoq, 10));
    }

    if (maxMoq) {
      query = query.lte("moq", Number.parseInt(maxMoq, 10));
    }

    if (sort === "price_asc") {
      query = query.order("indicative_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("indicative_price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
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
      error: err.message || "Failed to fetch products.",
    });
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "Database client unavailable.",
    });
  }

  try {
    const { data: product, error } = await insforge.database
      .from("products")
      .select("id, business_id, category_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, created_at, businesses(id, name, slug, city, state, verification_level)")
      .eq("id", id)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    const { data: images } = await insforge.database
      .from("product_images")
      .select("id, image_url, sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    return res.json({
      success: true,
      data: {
        ...product,
        images: images || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch product details.",
    });
  }
});

// POST /api/products
router.post("/products", async (req, res) => {
  const {
    business_id,
    category_id,
    title,
    description,
    moq,
    unit,
    indicative_price,
    tiered_pricing,
    specifications,
    hs_code,
  } = req.body;

  if (!business_id || !category_id || !title?.trim() || !indicative_price) {
    return res.status(400).json({
      success: false,
      error: "Business ID, Category ID, Title, and Indicative Price are required.",
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
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await insforge.database
      .from("products")
      .insert([
        {
          business_id,
          category_id,
          title: title.trim(),
          slug,
          description: description?.trim() || null,
          moq: Number.parseInt(moq, 10) || 1,
          unit: unit?.trim() || "pc",
          indicative_price: Number.parseFloat(indicative_price),
          tiered_pricing: Array.isArray(tiered_pricing) ? tiered_pricing : [],
          specifications: specifications || {},
          hs_code: hs_code?.trim() || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create product.",
    });
  }
});

export default router;
