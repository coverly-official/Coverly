# COVERLY — Secrets & Credential Hygiene Audit

> **Audit Date:** 2026-11-18  
> **Policy:** Secret values are **strictly redacted** and never printed in reports, logs, or commits.

---

## 1. Repository Secret Scan Results

A full recursive scan was performed across all source files (`*.ts`, `*.tsx`, `*.js`, `*.mjs`), JSON configs, HTML templates, Markdown documentation, and compiled frontend bundles (`frontend/dist/assets/*.js`).

### Findings Identified Before Remediation
| File Location | Secret Type Detected | Status After Remediation |
| :--- | :--- | :--- |
| `api/index.ts` (lines 5, 8) | Hardcoded `INSFORGE_ANON_KEY` & privileged `INSFORGE_API_KEY` | **REMOVED** (reads exclusively from `process.env`) |
| `api/render.ts` (line 5) | Hardcoded `INSFORGE_ANON_KEY` | **REMOVED** (reads exclusively from `process.env`) |
| `backend/src/lib/insforge.ts` (lines 18, 22) | Hardcoded `INSFORGE_ANON_KEY` & privileged `INSFORGE_API_KEY` | **REMOVED** (reads exclusively from `process.env`) |
| `frontend/src/lib/insforge.ts` (line 9) | Hardcoded `VITE_INSFORGE_ANON_KEY` fallback | **REMOVED** (reads from `import.meta.env.VITE_INSFORGE_ANON_KEY`) |
| `backend/src/db/marketplace-seed.mjs` (line 4) | Hardcoded privileged `INSFORGE_API_KEY` | **REMOVED** (throws if env var unset) |
| `backend/src/db/seed-data.mjs` (line 4) | Hardcoded privileged `INSFORGE_API_KEY` | **REMOVED** (throws if env var unset) |
| `backend/src/scripts/check-extended-tables.mjs` (line 4) | Hardcoded privileged `INSFORGE_API_KEY` | **REMOVED** (throws if env var unset) |
| `backend/src/scripts/comprehensive-audit.mjs` (line 4) | Hardcoded privileged `INSFORGE_API_KEY` | **REMOVED** (throws if env var unset) |
| `backend/src/scripts/inspect-database.mjs` (line 4) | Hardcoded privileged `INSFORGE_API_KEY` | **REMOVED** (throws if env var unset) |
| `docs/COVERLY_INITIAL_PROJECT_AUDIT.md` (line 42) | Exposed privileged `INSFORGE_API_KEY` in report text | **REDACTED** |
| `docs/README.md` (lines 160–161) | Exposed `INSFORGE_ANON_KEY` & `INSFORGE_API_KEY` in setup snippet | **REDACTED** |
| `.insforge/project.json` | Local CLI linkage file | **GITIGNORED** (never tracked) |
| `frontend/dist/assets/*.js` | Compiled browser bundle scan | **CLEAN (0 privileged secrets embedded)** |

### Post-Remediation Scan Verification
- Tracked repository secret scan (`ik_`, `sk_live_`, `sk_test_`, `anon_`, `BEGIN PRIVATE KEY`): **0 matches**.
- Frontend compiled bundle scan (`ik_`, `INSFORGE_API_KEY`, `SERVICE_ROLE`): **0 matches**.

---

## 2. Git History Exposure & Mandatory Rotation Incident Notice

> **CRITICAL ACTION REQUIRED BY PROJECT OWNER:**  
> Removing hardcoded credentials from the latest commit prevents future exposure in HEAD, **but the previously committed `INSFORGE_API_KEY` remains present in historical Git commits.**

Per security best practices (and without force-pushing or rewriting shared Git history without explicit approval), the project owner MUST perform the following steps immediately:

1. **Rotate `INSFORGE_API_KEY`** in the InsForge Project Console for **Coverly** (`4vwfw2w8.ap-southeast.insforge.app`) and revoke the previously committed key.
2. **Configure Vercel Environment Variables** (Vercel Dashboard -> Project Settings -> Environment Variables -> Production & Preview):
   - `INSFORGE_BASE_URL` (server-side)
   - `INSFORGE_ANON_KEY` (server-side)
   - `INSFORGE_API_KEY` (server-side ONLY — newly rotated key, NEVER prefixed with `VITE_`)
   - `VITE_INSFORGE_API_BASE` (public frontend)
   - `VITE_INSFORGE_ANON_KEY` (public frontend)
3. **Redeploy Vercel** after saving the rotated environment variables.
4. *(Optional, requires explicit team approval)*: If the repository is public and history scrubbing is desired, run `git filter-repo` or BFG Repo-Cleaner on a coordinated maintenance window after rotation is complete.

---

## 3. Ongoing Automated Prevention Controls Added

- **`.gitignore`**: Blocks `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.*.local`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.sql.bak`, `*.dump`, `kyc-uploads/`, `user-exports/`, and `logs/`.
- **`.env.example`**: Added at repository root with variable names and safe empty placeholders only.
- **`.github/workflows/security-and-ci.yml`**: Automatically blocks any push or PR that introduces tracked `.env`/key files, hardcoded secret patterns, or privileged strings in the compiled Vite bundle.
