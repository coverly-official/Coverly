import { Router } from "express";
import { getInsForgeClient } from "../lib/insforge.js";
import { calculateLandedCost } from "../lib/landed-cost.js";

const router = Router();

type DbCategory = {
  id: string;
  label: string;
  unit: string;
  default_qty: number;
};

type DbSupplier = {
  id: string;
  category_id: string;
  name: string;
  city: string;
  verified: boolean;
  unit_price: number;
  moq: number;
  freight: number;
  gst_rate: number;
};

router.get("/suppliers", async (_req, res) => {
  const insforge = getInsForgeClient();

  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge credentials are not configured.",
    });
  }

  try {
    const { data: categories, error: catError } = await insforge.database
      .from("product_categories")
      .select("id, label, unit, default_qty")
      .limit(50);

    if (catError) {
      return res.status(500).json({
        success: false,
        error: catError.message,
      });
    }

    const { data: suppliers, error: supError } = await insforge.database
      .from("suppliers")
      .select("id, category_id, name, city, verified, unit_price, moq, freight, gst_rate")
      .limit(200);

    if (supError) {
      return res.status(500).json({
        success: false,
        error: supError.message,
      });
    }

    const grouped = ((categories || []) as DbCategory[]).map((cat) => ({
      id: cat.id,
      label: cat.label,
      unit: cat.unit,
      defaultQty: Number(cat.default_qty),
      suppliers: ((suppliers || []) as DbSupplier[])
        .filter((s) => s.category_id === cat.id)
        .map((s) => ({
          name: s.name,
          city: s.city,
          verified: Boolean(s.verified),
          unitPrice: Number(s.unit_price),
          moq: Number(s.moq),
          freight: Number(s.freight),
          gstRate: Number(s.gst_rate),
        })),
    }));

    return res.json({
      success: true,
      source: "insforge",
      categories: grouped,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch suppliers",
    });
  }
});

router.post("/rfq/calculate", async (req, res) => {
  const { categoryId, quantity, destinationCity } = req.body as {
    categoryId?: string;
    quantity?: number;
    destinationCity?: string;
  };

  if (!categoryId || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      error: "Valid categoryId and positive quantity are required.",
    });
  }

  const insforge = getInsForgeClient();
  if (!insforge) {
    return res.status(503).json({
      success: false,
      error: "InsForge credentials are not configured.",
    });
  }

  try {
    const { data: suppliers, error } = await insforge.database
      .from("suppliers")
      .select("name, city, verified, unit_price, moq, freight, gst_rate")
      .eq("category_id", categoryId)
      .limit(100);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const computed = ((suppliers || []) as DbSupplier[]).map((supplier) => {
      const calculation = calculateLandedCost({
        unitPrice: Number(supplier.unit_price),
        quantity,
        gstRate: Number(supplier.gst_rate),
        freight: Number(supplier.freight),
      });

      return {
        name: supplier.name,
        city: supplier.city,
        verified: Boolean(supplier.verified),
        unitPrice: Number(supplier.unit_price),
        moq: Number(supplier.moq),
        freight: Number(supplier.freight),
        gstRate: Number(supplier.gst_rate),
        isMoqMet: quantity >= Number(supplier.moq),
        calculation,
      };
    });

    const eligible = computed.filter((s) => s.isMoqMet);
    const best =
      eligible.sort(
        (a, b) => a.calculation.landedPerUnit - b.calculation.landedPerUnit
      )[0] || null;

    await insforge.database.from("rfq_logs").insert([
      {
        category_id: categoryId,
        quantity,
        destination_city: destinationCity || "Raipur",
        best_supplier: best ? best.name : null,
        best_landed_per_unit: best ? best.calculation.landedPerUnit : null,
      },
    ]);

    return res.json({
      success: true,
      suppliers: computed,
      bestSupplier: best,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to calculate RFQ",
    });
  }
});

export default router;
