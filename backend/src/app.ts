import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import healthRoutes from "./routes/health.js";
import supplierRoutes from "./routes/suppliers.js";
import conciergeRoutes from "./routes/concierge.js";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import productsRoutes from "./routes/products.js";
import directoryRoutes from "./routes/directory.js";
import rfqsRoutes from "./routes/rfqs.js";
import quotationsRoutes from "./routes/quotations.js";
import ordersRoutes from "./routes/orders.js";
import verificationsRoutes from "./routes/verifications.js";
import adminRoutes from "./routes/admin.js";
import ticketsRoutes from "./routes/tickets.js";
import notificationsRoutes from "./routes/notifications.js";
import businessServicesRoutes from "./routes/business-services.js";
import businessesRoutes from "./routes/businesses.js";
import reportsRoutes from "./routes/reports.js";
import wholesalerRoutes from "./routes/wholesaler.js";
import logisticsRoutes from "./routes/logistics.js";
import transportersRoutes from "./routes/transporters.js";
import salesAgentsRoutes from "./routes/sales-agents.js";
import rawMaterialsRoutes from "./routes/raw-materials.js";
import packagingRoutes from "./routes/packaging.js";
import importExportRoutes from "./routes/import-export.js";
import buyerRoutes from "./routes/buyers.js";
import retailerRoutes from "./routes/retailers.js";

const currentDir = typeof import.meta !== "undefined" && import.meta.url
  ? path.dirname(fileURLToPath(import.meta.url))
  : process.cwd();
dotenv.config({ path: path.resolve(currentDir, "../.env") });
dotenv.config({ path: path.resolve(currentDir, "../../.env.local") });
dotenv.config();

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed at Edge CDN
  })
);

// Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Generous limit for development & staging
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

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

// Mount modular REST APIs
app.use("/api", healthRoutes);
app.use("/api", supplierRoutes);
app.use("/api", conciergeRoutes);
app.use("/api", authRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", productsRoutes);
app.use("/api", directoryRoutes);
app.use("/api", rfqsRoutes);
app.use("/api", quotationsRoutes);
app.use("/api", ordersRoutes);
app.use("/api", verificationsRoutes);
app.use("/api", adminRoutes);
app.use("/api", ticketsRoutes);
app.use("/api", notificationsRoutes);
app.use("/api", businessServicesRoutes);
app.use("/api", businessesRoutes);
app.use("/api", reportsRoutes);
app.use("/api", wholesalerRoutes);
app.use("/api", logisticsRoutes);
app.use("/api", transportersRoutes);
app.use("/api", salesAgentsRoutes);
app.use("/api", rawMaterialsRoutes);
app.use("/api", packagingRoutes);
app.use("/api", importExportRoutes);
app.use("/api", buyerRoutes);
app.use("/api", retailerRoutes);

export default app;
