# Coverly - Modern Wholesale Marketplace for Indian MSMEs

Full-stack React + Express + InsForge application for **Coverly**, structured with separate `frontend/` and `backend/` workspaces and configured for Vercel deployment.

## Project Structure

- `frontend/` - React + Vite + TypeScript + Tailwind CSS + Framer Motion UI
- `backend/` - Express + TypeScript + `@insforge/sdk` API server + PostgreSQL schema (`backend/database/schema.sql`)
- `api/index.ts` - Vercel Serverless Function entry for `/api/*`
- `vercel.json` - Unified Vercel deployment configuration (Frontend SPA + Backend API)

## Local Development

1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Configure environment variables in `backend/.env` (see `backend/.env.example`):
   ```env
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   INSFORGE_BASE_URL=https://your-project.insforge.app
   INSFORGE_ANON_KEY=your-anon-key
   INSFORGE_API_KEY=your-api-key
   ```
3. Run `backend/database/schema.sql` in your InsForge Database SQL console to create and seed the tables.
4. Start both frontend and backend:
   ```bash
   npm run dev
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Vercel Deployment

1. Import the repository into Vercel (Root Directory: `.`).
2. Add the backend environment variables (`INSFORGE_BASE_URL`, `INSFORGE_ANON_KEY`, `INSFORGE_API_KEY`) in Vercel Project Settings.
3. Deploy — `vercel.json` builds `frontend/dist` and routes `/api/*` to the Express serverless backend.
