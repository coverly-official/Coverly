import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import supplierRoutes from "./routes/suppliers.js";
import conciergeRoutes from "./routes/concierge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN?.trim();
const allowedOrigins =
  corsOrigin && corsOrigin !== "*"
    ? corsOrigin.split(",").map((origin) => origin.trim())
    : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", supplierRoutes);
app.use("/api", conciergeRoutes);

export default app;
