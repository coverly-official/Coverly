import { Router } from "express";
import { generateOgPngBuffer } from "../lib/og-image-generator.js";

const router = Router();

/**
 * GET /api/og-image
 * Public, unauthenticated dynamic 1200x630 PNG generator for WhatsApp, Facebook,
 * LinkedIn, and Twitter/X rich link previews when a listing has no uploaded image
 * or for category/service/business cards.
 */
router.get("/og-image", async (req, res) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type : "home";
    const title = typeof req.query.title === "string" ? req.query.title : undefined;
    const subtitle = typeof req.query.subtitle === "string" ? req.query.subtitle : undefined;
    const meta = typeof req.query.meta === "string" ? req.query.meta : undefined;
    const badge = typeof req.query.badge === "string" ? req.query.badge : undefined;

    const pngBuffer = await generateOgPngBuffer({
      type,
      title,
      subtitle,
      meta,
      badge,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(pngBuffer);
  } catch (err: any) {
    console.error("Failed to generate OG PNG:", err);
    // Safe fallback redirect to official static branded PNG banner
    return res.redirect(302, "/og/coverly-home.png");
  }
});

export default router;
