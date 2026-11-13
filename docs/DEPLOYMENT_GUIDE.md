# COVERLY — Deployment Guide & Infrastructure Operations

This document provides step-by-step instructions for deploying and operating the COVERLY B2B Wholesale Platform across Vercel (Edge & Serverless compute) and InsForge (PostgreSQL, Auth, Storage, Edge Functions).

---

## 1. Monorepo Architecture Overview

COVERLY utilizes a Vercel-optimized full-stack monorepo:

```
Coverly/
├── api/
│   └── index.ts            # Serverless entrypoint wrapping Express app
├── backend/
│   ├── src/                # Express application source code
│   └── package.json        # Backend dependencies & build scripts
├── frontend/
│   ├── src/                # React 18 + Vite 6 + Tailwind application
│   └── package.json        # Frontend dependencies & build scripts
├── migrations/             # InsForge SQL migrations
├── vercel.json             # Monorepo build and routing configuration
└── package.json            # Root workspace scripts
```

### Vercel Serverless Routing (`vercel.json`)
The root `vercel.json` coordinates building both frontend assets and serverless backend functions:
- Static assets build from `frontend/` into standard Vercel Edge CDN distribution.
- API traffic matching `/api/(.*)` routes directly to `api/index.ts`.
- SPA history routing rewrites non-API requests to `index.html`.

---

## 2. Environment Variables Matrix

The following environment variables must be configured in Vercel Project Settings:

| Variable Name | Environment | Required By | Description | Example / Value |
|---|---|---|---|---|
| `NODE_ENV` | All | Backend | Runtime mode | `production` |
| `INSFORGE_PROJECT_ID` | All | Backend, CLI | Target project identifier | `a60f176f-7863-493d-8fef-cf42a662a217` |
| `INSFORGE_API_BASE` | All | Frontend, Backend | API gateway endpoint | `https://4vwfw2w8.ap-southeast.insforge.app` |
| `INSFORGE_ANON_KEY` | All | Frontend | Client-side BaaS key | `anon_9da4...` |
| `INSFORGE_API_KEY` | All | Backend | Privileged server-side key | `ik_1d1f...` |
| `PORT` | Local | Backend | Local development port | `3001` |
| `VITE_API_URL` | Production | Frontend | API base URL for client | `/api` |

> [!CAUTION]
> Never expose `INSFORGE_API_KEY` to client-side bundles. Only `INSFORGE_ANON_KEY` is permissible in Vite environment bundles prefixed with `VITE_`.

---

## 3. Database Migration Deployment Workflow

All database migrations are maintained under `migrations/` and managed via `@insforge/cli`.

### Step 1: Link Project Locally
```bash
npx @insforge/cli link --project-id a60f176f-7863-493d-8fef-cf42a662a217
```

### Step 2: Create a New Migration
```bash
npx @insforge/cli db migrations new <migration-name>
```

### Step 3: Apply Migrations
```bash
npx @insforge/cli db migrations up --all
```

### Step 4: Verify Migration Status
```bash
npx @insforge/cli db migrations list
```

---

## 4. InsForge Storage Bucket Provisioning

The following buckets must be active in the InsForge Storage console:

1. **`business-docs`** (Private)
   - Purpose: GSTIN certificates, PAN cards, factory audit reports.
   - Max file size: 10MB.
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`.
   - Access: Authenticated users can upload to their business directory; only Admins and document owners can read.

2. **`product-images`** (Public)
   - Purpose: Product gallery photographs, technical spec sheets.
   - Max file size: 5MB.
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
   - Access: Public read; authenticated suppliers can upload to their product directory.

3. **`order-attachments`** (Private)
   - Purpose: Signed purchase orders, bills of lading, dispatch inspection slips.
   - Max file size: 15MB.
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`.
   - Access: Restricted to order buyer and assigned supplier.

---

## 5. Local Development Workflow

Run both frontend and backend concurrently in separate terminals or via root workspace:

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend Client
cd frontend
npm run dev
```

- Frontend URL: `http://localhost:5173`
- Backend URL: `http://localhost:3001`
- API Health Check: `http://localhost:3001/api/health`

---

## 6. Vercel Production Deployment

### Automated Git Deployments
Every push to branch `main` on `https://github.com/coverly-official/Coverly` automatically triggers a production deployment on Vercel.

### Vercel CLI Manual Deploy
```bash
# Deploy Preview
vercel

# Deploy Production
vercel --prod
```

### Build Command Verification
Verify that root build script runs cleanly before deploying:
```bash
npm run build
```

---

## 7. Rollback & Incident Response Procedure

1. **Instant Vercel Rollback**:
   - Navigate to Vercel Dashboard $\to$ Deployments.
   - Select the last verified healthy deployment.
   - Click `Instant Rollback` (takes $< 5$ seconds).
2. **Database Schema Rollbacks**:
   - If a migration caused failures, author a compensating migration rather than rolling back in place to protect historical data integrity:
     ```bash
     npx @insforge/cli db migrations new rollback-<issue>
     npx @insforge/cli db migrations up --all
     ```
3. **Emergency Circuit Breaker**:
   - If downstream services or spam traffic creates instability, toggle maintenance mode in Vercel Edge Middleware or platform settings table.
