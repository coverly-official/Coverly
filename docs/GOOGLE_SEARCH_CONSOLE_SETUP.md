# COVERLY — Google Search Console Setup & Indexing Runbook

> **Status:** Prepared for Domain Owner Execution (Not Claimed Completed Until Executed in Google Search Console)  
> **Target Property:** `https://coverly-indol.vercel.app` (or custom production domain once mapped)

---

## 1. Domain & Property Verification

1. Open [Google Search Console](https://search.google.com/search-console) using the official COVERLY Google account.
2. Add a **URL Prefix** property for `https://coverly-indol.vercel.app` (or a **Domain** property once your custom `.com`/`.in` domain DNS is connected).
3. Choose **HTML tag verification** (or **DNS TXT record** for a custom domain):
   - For HTML tag verification: copy the `<meta name="google-site-verification" content="..." />` tag provided by Google and place it inside `<head>` in `frontend/index.html`, then deploy.
   - Click **Verify** in Google Search Console.

---

## 2. Sitemap Submission

1. In Google Search Console -> **Indexing** -> **Sitemaps**.
2. Enter: `sitemap.xml` (full URL: `https://coverly-indol.vercel.app/sitemap.xml`).
3. Click **Submit** and verify status transitions to **Success** with discovered URLs > 0.

---

## 3. URL Inspection & Canonical Verification

Use Search Console's **URL Inspection** tool on representative live URLs:
- `https://coverly-indol.vercel.app/` (Homepage — expect `index, follow`, `Organization` + `WebSite` schema)
- `https://coverly-indol.vercel.app/products/<active-product-id>` (Expect `Product` + `BreadcrumbList` schema)
- `https://coverly-indol.vercel.app/manufacturers/<active-slug>` (Expect `LocalBusiness` + `BreadcrumbList` schema)
- `https://coverly-indol.vercel.app/services` & `/services/category/accounting-finance`
- `https://coverly-indol.vercel.app/verified-manufacturers-india`
- `https://coverly-indol.vercel.app/admin/dashboard` (Confirm **Excluded by `noindex` tag**)
- `https://coverly-indol.vercel.app/this-route-does-not-exist` (Confirm **Not Found (404)** — no soft-404)

---

## 4. Ongoing Search Performance Monitoring

- Review **Indexing -> Pages** weekly to ensure zero private workspace routes are indexed and zero unexpected 404/5xx spikes appear.
- Monitor **Enhancements -> Breadcrumbs / Product Snippets / FAQ** for structured data warnings.
- Track **Core Web Vitals** (Mobile & Desktop) once sufficient CrUX field data accumulates.
