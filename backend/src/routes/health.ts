import { Router } from "express";
import { getInsForgeConfigStatus } from "../lib/insforge.js";

const router = Router();

router.get("/health", (_req, res) => {
  const insforge = getInsForgeConfigStatus();
  res.json({
    ok: true,
    service: "coverly-backend",
    database: "insforge",
    insforge,
    timestamp: new Date().toISOString(),
  });
});

export default router;
