# COVERLY — Performance Optimization Audit

> **Audit Date:** 2026-11-18  
> **Note:** Only directly measured build & response metrics are reported below; synthetic/field Lighthouse or CrUX Core Web Vitals scores are NOT claimed without running real browser lab/field telemetry.

---

## 1. Frontend Optimizations Implemented

- **Manual Vendor Chunk Splitting (`frontend/vite.config.ts`)**:
  - Split previously monolithic single JS bundle (`2,161 KB` raw / `429 KB` gzip) into cacheable vendor chunks:
    - `vendor-react` (`react`, `react-dom`, `react-router-dom`)
    - `vendor-motion` (`framer-motion`)
    - `vendor-icons` (`lucide-react`)
    - `vendor-insforge` (`@insforge/sdk`)
    - Application bundle (`index-*.js`)
  - Improves long-term browser cache hit ratios across deployments (returning users only download changed app code, not unchanged vendor libraries).
- **OG Image Compression & Immutable CDN Caching**:
  - All 8 static 1200×630 PNG OG banners are compressed between `106 KB` and `201 KB` and served with `Cache-Control: public, max-age=86400, s-maxage=604800, immutable`.
  - Dynamic `/api/og-image` PNG responses are compressed (`92–143 KB`) with 7-day edge caching (`s-maxage=604800, stale-while-revalidate=86400`).
- **Reduced-Motion & Responsive Accessibility**:
  - Custom animated 404 page (`NotFoundPage.tsx`) honors `prefers-reduced-motion` via Framer Motion's `useReducedMotion()`, avoiding unnecessary GPU animation overhead on low-powered or reduced-motion devices.

---

## 2. Backend & Edge Optimizations Implemented

- **Public Metadata Edge Caching (`api/render.ts`)**: Public HTML pages are cached at Vercel's CDN (`s-maxage=300, stale-while-revalidate=3600`) while private routes and 404s bypass caching (`private, no-store`).
- **Sitemap Caching (`api/sitemap.ts`)**: XML sitemap cached at edge (`s-maxage=3600, stale-while-revalidate=86400`) with bounded parallel DB queries (`Promise.all` with `limit(500)`).
- **Lightweight API Lambda Separation**: Heavy SVG/WASM PNG rendering (`satori` + `@resvg/resvg-wasm`) is isolated inside `api/og-image.ts` so the main Express REST API (`api/index.ts`) stays fast and unaffected.
- **Database Query Discipline**: Public listing endpoints enforce `limit` + pagination (`range(offset, offset + limit - 1)`), head-only counts (`{ count: "exact", head: true }`) for admin metrics, and explicit column allowlists.

---

## 3. Recommended Next-Phase Core Web Vitals Measurements

To capture real Core Web Vitals (**LCP**, **INP**, **CLS**) after production deployment:
1. Run Google PageSpeed Insights (`https://pagespeed.web.dev/`) against `https://coverly-indol.vercel.app/` and `/products` on Mobile and Desktop.
2. Enable route-level `React.lazy()` code splitting for Admin/Buyer/Supplier workspace sub-trees if Mobile LCP exceeds 2.5s.
3. Convert future user-uploaded product photos to responsive WebP/AVIF thumbnails at upload time.
