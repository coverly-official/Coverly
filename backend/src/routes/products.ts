import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { authenticateUser, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

// GET /api/products
router.get("/products", async (req, res) => {
  const {
    category,
    search,
    minMoq,
    maxMoq,
    minPrice,
    maxPrice,
    city,
    sort,
    page = "1",
    limit = "20",
  } = req.query as Record<string, string | undefined>;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const pageNum = Math.max(1, Number.parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit || "20", 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, created_at, businesses(id, name, slug, city, state, verification_level), product_images(id, image_url, sort_order)",
        { count: "exact" }
      )
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

    if (minPrice) {
      query = query.gte("indicative_price", Number.parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("indicative_price", Number.parseFloat(maxPrice));
    }

    if (sort === "price_asc") {
      query = query.order("indicative_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("indicative_price", { ascending: false });
    } else if (sort === "moq_asc") {
      query = query.order("moq", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, count, error } = await query.range(offset, offset + limitNum - 1);

    if (error) {
      return sendError(res, error.message, 500, "DATABASE_ERROR");
    }

    // Filter by city if requested
    let filteredData = data || [];
    if (city?.trim()) {
      filteredData = filteredData.filter(
        (p: any) => p.businesses?.city?.toLowerCase() === city.trim().toLowerCase()
      );
    }

    return sendSuccess(res, {
      items: filteredData,
      total: count || filteredData.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || filteredData.length) / limitNum),
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch products.", 500, "SERVER_ERROR");
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: product, error } = await insforge.database
      .from("products")
      .select(
        "id, business_id, category_id, subcategory_id, title, slug, description, moq, unit, indicative_price, tiered_pricing, specifications, hs_code, is_active, created_at, businesses(id, name, slug, city, state, address, phone, email, website, verification_level)"
      )
      .eq("id", id)
      .single();

    if (error || !product) {
      return sendError(res, "Product not found.", 404, "NOT_FOUND");
    }

    const { data: images } = await insforge.database
      .from("product_images")
      .select("id, image_url, image_key, sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    return sendSuccess(res, {
      ...product,
      images: images || [],
    });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch product details.", 500, "SERVER_ERROR");
  }
});

// POST /api/products (Create Product)
router.post(
  "/products",
  authenticateUser,
  requireRole("manufacturer", "wholesaler", "distributor", "buyer_supplier", "admin"),
  async (req, res) => {
    const user = req.user!;
    const {
      business_id,
      category_id,
      subcategory_id,
      title,
      description,
      moq = 1,
      unit = "pc",
      indicative_price,
      tiered_pricing,
      specifications,
      hs_code,
      images,
    } = req.body;

    if (!business_id || !category_id || !title?.trim() || indicative_price === undefined) {
      return sendError(
        res,
        "Business ID, Category ID, Title, and Indicative Price are required.",
        400,
        "VALIDATION_FAILED"
      );
    }

    const insforge = getInsForgeClient();
    if (!insforge) {
      return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
    }

    try {
      // 1. Verify business ownership/membership
      if (!user.roles.includes("admin")) {
        const { data: member } = await insforge.database
          .from("business_members")
          .select("role_in_business")
          .eq("business_id", business_id)
          .eq("user_id", user.id)
          .single();

        if (!member || !["owner", "admin", "sales"].includes(member.role_in_business)) {
          return sendError(res, "You are not authorized to create products for this business.", 403, "FORBIDDEN");
        }
      }

      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      // 2. Insert Product
      const { data: product, error } = await insforge.database
        .from("products")
        .insert([
          {
            business_id,
            category_id,
            subcategory_id: subcategory_id || null,
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

      if (error || !product) {
        return sendError(res, error?.message || "Failed to create product.", 500, "DATABASE_ERROR");
      }

      // 3. Insert images if provided
      if (Array.isArray(images) && images.length > 0) {
        const imgPayload = images.map((img: any, idx: number) => ({
          product_id: product.id,
          image_url: img.image_url,
          image_key: img.image_key || "img",
          sort_order: img.sort_order ?? idx,
        }));
        await insforge.database.from("product_images").insert(imgPayload);
      }

      return sendSuccess(res, product, "Product created successfully.", 201);
    } catch (err: any) {
      return sendError(res, err.message || "Failed to create product.", 500, "SERVER_ERROR");
    }
  }
);

// PATCH /api/products/:id (Update Product)
router.patch("/products/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;
  const {
    category_id,
    subcategory_id,
    title,
    description,
    moq,
    unit,
    indicative_price,
    tiered_pricing,
    specifications,
    hs_code,
    is_active,
  } = req.body;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    // 1. Fetch existing product to verify business ownership
    const { data: existingProduct, error: fetchErr } = await insforge.database
      .from("products")
      .select("id, business_id")
      .eq("id", id)
      .single();

    if (fetchErr || !existingProduct) {
      return sendError(res, "Product not found.", 404, "NOT_FOUND");
    }

    if (!user.roles.includes("admin")) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("role_in_business")
        .eq("business_id", existingProduct.business_id)
        .eq("user_id", user.id)
        .single();

      if (!member || !["owner", "admin", "sales"].includes(member.role_in_business)) {
        return sendError(res, "You are not authorized to update this product.", 403, "FORBIDDEN");
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (category_id) updatePayload.category_id = category_id;
    if (subcategory_id !== undefined) updatePayload.subcategory_id = subcategory_id;
    if (title?.trim()) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (moq !== undefined) updatePayload.moq = Number.parseInt(moq, 10);
    if (unit?.trim()) updatePayload.unit = unit.trim();
    if (indicative_price !== undefined) updatePayload.indicative_price = Number.parseFloat(indicative_price);
    if (tiered_pricing !== undefined) updatePayload.tiered_pricing = tiered_pricing;
    if (specifications !== undefined) updatePayload.specifications = specifications;
    if (hs_code !== undefined) updatePayload.hs_code = hs_code ? hs_code.trim() : null;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;

    const { data: updatedProduct, error: updateErr } = await insforge.database
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return sendError(res, updateErr.message, 500, "DATABASE_ERROR");
    }

    return sendSuccess(res, updatedProduct, "Product updated successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update product.", 500, "SERVER_ERROR");
  }
});

// DELETE /api/products/:id (Archive / Soft-delete)
router.delete("/products/:id", authenticateUser, async (req, res) => {
  const user = req.user!;
  const { id } = req.params;

  const insforge = getInsForgeClient();
  if (!insforge) {
    return sendError(res, "Database client unavailable.", 503, "SERVICE_UNAVAILABLE");
  }

  try {
    const { data: product } = await insforge.database
      .from("products")
      .select("business_id")
      .eq("id", id)
      .single();

    if (!product) {
      return sendError(res, "Product not found.", 404, "NOT_FOUND");
    }

    if (!user.roles.includes("admin")) {
      const { data: member } = await insforge.database
        .from("business_members")
        .select("role_in_business")
        .eq("business_id", product.business_id)
        .eq("user_id", user.id)
        .single();

      if (!member || !["owner", "admin"].includes(member.role_in_business)) {
        return sendError(res, "Not authorized to delete this product.", 403, "FORBIDDEN");
      }
    }

    await insforge.database
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    return sendSuccess(res, null, "Product archived successfully.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to archive product.", 500, "SERVER_ERROR");
  }
});

// POST /api/products/:id/images
router.post("/products/:id/images", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { image_url, image_key, sort_order = 0 } = req.body;

  if (!image_url?.trim()) {
    return sendError(res, "image_url is required.", 400, "VALIDATION_FAILED");
  }

  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    const { data, error } = await insforge.database
      .from("product_images")
      .insert([
        {
          product_id: id,
          image_url: image_url.trim(),
          image_key: image_key || "img",
          sort_order: Number.parseInt(sort_order, 10) || 0,
        },
      ])
      .select()
      .single();

    if (error) return sendError(res, error.message, 500, "DATABASE_ERROR");
    return sendSuccess(res, data, "Product image added successfully.", 201);
  } catch (err: any) {
    return sendError(res, err.message, 500, "SERVER_ERROR");
  }
});

// DELETE /api/products/:id/images/:imageId
router.delete("/products/:id/images/:imageId", authenticateUser, async (req, res) => {
  const { id, imageId } = req.params;
  const insforge = getInsForgeClient();
  if (!insforge) return sendError(res, "Database unavailable.", 503, "SERVICE_UNAVAILABLE");

  try {
    await insforge.database
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", id);

    return sendSuccess(res, null, "Product image removed successfully.");
  } catch (err: any) {
    return sendError(res, err.message, 500, "SERVER_ERROR");
  }
});

export default router;
