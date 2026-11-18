export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  slug: string;
  path: string;
  title: string;
  category: "Core Governance" | "Marketplace Terms" | "Orders & Logistics" | "Rights & Compliance";
  summary: string;
  version: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const LEGAL_PLACEHOLDERS = {
  entityName: "[COVERLY LEGAL ENTITY NAME — PENDING REGISTRATION CONFIRMATION]",
  registeredAddress: "[REGISTERED OFFICE ADDRESS — TO BE CONFIRMED PRIOR TO PUBLICATION]",
  gstinCin: "[CIN / GSTIN — TO BE INSERTED UPON ENTITY VERIFICATION]",
  privacyEmail: "[PRIVACY CONTACT EMAIL — e.g., privacy@yourdomain.com]",
  supportEmail: "[OFFICIAL SUPPORT EMAIL — e.g., support@yourdomain.com]",
  grievanceOfficer: "[DESIGNATED GRIEVANCE OFFICER NAME, DESIGNATION & EMAIL — PENDING APPOINTMENT]",
  jurisdiction: "[APPLICABLE COURT JURISDICTION, INDIA — PENDING LEGAL COUNSEL CONFIRMATION]",
};

const DOC_VERSION = "v1.0 (Draft — Pending Legal Counsel Review)";
const DOC_DATE = "2026-11-18";

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    title: "Privacy Policy",
    category: "Core Governance",
    summary:
      "How COVERLY collects, uses, secures, retains and deletes account, business, KYC and technical data across our B2B platform.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Scope & Draft Legal Review Notice",
        body: [
          `This Privacy Policy explains how ${LEGAL_PLACEHOLDERS.entityName} ("COVERLY", "we", "us") collects, processes, stores and protects personal and business information when buyers, retailers, manufacturers, wholesalers, distributors, transporters, logistics partners, sales agents, service providers and website visitors use https://coverly-indol.vercel.app.`,
          "Notice: This policy has been drafted to align with COVERLY's actual technical implementation and applicable Indian frameworks including the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000. It must be reviewed and finalized with qualified Indian legal counsel once official corporate registration and Grievance Officer details are confirmed.",
        ],
      },
      {
        heading: "2. Information We Collect",
        body: [
          "Account Information: Full name, work email address, mobile/phone number, authentication identifiers, account roles and consent timestamps.",
          "Business Information: Business name, legal name, business category/type, city, state, pincode, branch details, product/service catalogues and publicly listed business descriptions.",
          "KYC & Verification Information: Tax registration numbers (e.g., GSTIN/PAN/IEC where submitted), business incorporation or authorization documents uploaded for verification review. These records are kept separate from public profiles and restricted to authorized verification personnel.",
          "Transaction & Procurement Records: RFQs, enquiries, quotations, purchase requisitions, purchase orders, logistics bookings, trip records, invoices and dispute tickets created on the platform.",
          "Technical Information: Browser type, device viewport, IP address (for security rate-limiting and abuse prevention), request timestamps and essential authentication/session storage tokens.",
        ],
      },
      {
        heading: "3. Purpose of Data Collection & Processing",
        body: [
          "We process data strictly to operate B2B discovery, route RFQs and quotations between buyers and suppliers, calculate indicative landed costs, perform business verification reviews, support role-based enterprise teams, prevent fraud/spam, maintain audit trails and comply with statutory legal obligations.",
        ],
      },
      {
        heading: "4. Cookies & Local Browser Storage",
        body: [
          "COVERLY uses essential browser storage and session mechanisms required for authentication, role workspace state and cookie consent preferences. Optional analytics or marketing cookies are not enabled unless you explicitly opt in via our Cookie Preferences control. See our Cookie Policy (/cookie-policy) for full details.",
        ],
      },
      {
        heading: "5. Data Sharing & Third-Party Service Providers",
        body: [
          "Public business listings (business name, city/state, active product/service listings and verification status) are visible to marketplace visitors. Private user credentials, internal KYC documents, private RFQs, buyer purchase histories and financial records are never exposed publicly.",
          "When you submit an RFQ, enquiry, quotation, order or logistics booking, relevant commercial details are shared with the counterparty business(es) necessary to fulfill that request.",
          "We rely on vetted infrastructure providers (including InsForge for PostgreSQL database, authentication and file storage, and Vercel for web hosting and edge delivery) acting under appropriate security and confidentiality obligations.",
        ],
      },
      {
        heading: "6. Data Security & Realistic Safeguards",
        body: [
          "COVERLY implements role-based access control (RBAC), PostgreSQL Row-Level Security (RLS), HTTPS transport encryption, rate limiting, security headers, private admin/user layout isolation and administrative audit logging.",
          "While we maintain reasonable technical and organizational safeguards aligned with industry standards, no internet transmission or electronic storage system can be guaranteed 100% immune from unauthorized access.",
        ],
      },
      {
        heading: "7. Data Retention & Account Deletion",
        body: [
          "We retain active account and business data for as long as your account remains active or as required to resolve disputes, maintain commercial audit logs and comply with Indian tax, accounting and statutory record-keeping laws.",
          "You may request account deactivation, account deletion, consent withdrawal or a summary of your personal data at any time through our Account Deletion Policy (/account-deletion-policy) or authenticated privacy request channel.",
        ],
      },
      {
        heading: "8. Your Rights, Consent & International Transfers",
        body: [
          "Subject to the DPDP Act, 2023 and applicable rules, Data Principals may request access to personal data summary, correction/updating of inaccurate data, erasure (where not superseded by statutory retention), consent withdrawal and grievance redressal.",
          "Cloud infrastructure (such as InsForge regional servers and Vercel edge delivery) may process data outside India in accordance with applicable cross-border transfer requirements under Indian law.",
        ],
      },
      {
        heading: "9. Policy Updates & Grievance Contact",
        body: [
          "Material changes to this Privacy Policy will be reflected by updating the version and date above, and where required, requesting renewed consent.",
          `Privacy Contact: ${LEGAL_PLACEHOLDERS.privacyEmail} | Grievance Officer: ${LEGAL_PLACEHOLDERS.grievanceOfficer} | Registered Office: ${LEGAL_PLACEHOLDERS.registeredAddress}`,
        ],
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    path: "/terms-and-conditions",
    title: "Terms & Conditions",
    category: "Core Governance",
    summary:
      "Core rules governing use of COVERLY as a B2B discovery, sourcing, RFQ, supplier, logistics and business services platform.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Platform Role & Intermediary Status",
        body: [
          `COVERLY, operated by ${LEGAL_PLACEHOLDERS.entityName}, operates as an online B2B technology platform and marketplace intermediary connecting independent buyers, retailers, manufacturers, wholesalers, distributors, raw material suppliers, packaging suppliers, importers/exporters, logistics partners, transporters, sales agents and business service providers.`,
          "Unless explicitly stated in a separate written contract signed by COVERLY, COVERLY is not the manufacturer, seller, buyer, carrier, insurer or guarantor of any goods, freight or professional services listed by third-party users.",
        ],
      },
      {
        heading: "2. Eligibility & Account Registration",
        body: [
          "Users must be at least 18 years old and legally authorized to enter into binding commercial agreements on behalf of themselves or their represented business entity. Business Owners are responsible for employee accounts, branch assignments and spending limits configured within their organization.",
        ],
      },
      {
        heading: "3. Business Verification",
        body: [
          "COVERLY may review voluntarily submitted registration or KYC documents to assign internal verification indicators. Verification reflects document review at the time of submission only and does not constitute a warranty or guarantee of creditworthiness, product quality, regulatory compliance or delivery performance.",
        ],
      },
      {
        heading: "4. Listings, RFQs, Quotations & Third-Party Transactions",
        body: [
          "Suppliers are solely responsible for the accuracy of product titles, specifications, MOQ tiers, indicative prices, GST rates, HS codes and legal authorizations. Buyers are solely responsible for evaluating quotes, landed-cost assumptions and contractual terms before issuing purchase orders.",
          "Any resulting supply contract, payment arrangement, warranty, dispatch, inspection or settlement is strictly between the transacting businesses.",
        ],
      },
      {
        heading: "5. Platform Fees, Prohibited Conduct & Enforcement",
        body: [
          "Where optional subscriptions, featured listings or value-added platform services apply, applicable fees will be disclosed clearly prior to activation.",
          "Users must comply with our Acceptable Use Policy (/acceptable-use-policy). COVERLY reserves the right to moderate listings, suspend accounts or revoke access for fraud, misrepresentation, spam, IP infringement or security violations.",
        ],
      },
      {
        heading: "6. Intellectual Property, Liability Limitation & Governing Law",
        body: [
          "All COVERLY software, branding, UI design and documentation remain the intellectual property of COVERLY. Users retain ownership of their business content while granting COVERLY a non-exclusive license to display public listings on the platform.",
          "To the maximum extent permitted by applicable law, COVERLY disclaims indirect, incidental or consequential commercial losses arising from third-party transactions, supplier delays, product defects or payment defaults.",
          `Governing Law & Jurisdiction: Laws of India; courts at ${LEGAL_PLACEHOLDERS.jurisdiction}. Contact: ${LEGAL_PLACEHOLDERS.supportEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "cookie-policy",
    path: "/cookie-policy",
    title: "Cookie Policy",
    category: "Core Governance",
    summary:
      "Transparent breakdown of essential browser storage, session cookies and optional preference controls on COVERLY.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. What Technologies COVERLY Uses",
        body: [
          "COVERLY uses minimal browser storage mechanisms (cookies and localStorage) necessary to operate secure sign-in sessions, preserve your active business workspace role and store your privacy consent choices.",
        ],
      },
      {
        heading: "2. Categories of Cookies & Storage",
        body: [
          "Strictly Necessary / Essential (Always Active): Required for authentication state, session restoration, CSRF/security integrity, role-based workspace routing and recording your cookie preference selection.",
          "Preference Storage (Optional — Opt-In): Remembers optional UI preferences such as preferred sourcing city or table display filters.",
          "Analytics (Optional — Opt-In): Currently disabled by default. If third-party analytics tools are introduced in the future, they will only activate after explicit opt-in consent.",
        ],
      },
      {
        heading: "3. Managing or Withdrawing Cookie Consent",
        body: [
          "You may update or withdraw optional cookie preferences at any time by clicking 'Cookie Preferences' in the COVERLY website footer, or by clearing cookies/localStorage in your browser settings. Disabling essential storage may prevent signing into protected workspaces.",
        ],
      },
    ],
  },
  {
    slug: "disclaimer",
    path: "/disclaimer",
    title: "Platform Disclaimer",
    category: "Core Governance",
    summary:
      "Clarifications on indicative pricing, landed-cost calculations, third-party listings and verification indicators.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Indicative Pricing & Landed-Cost Estimates",
        body: [
          "All product prices, MOQ tiers, GST rates, freight estimates and landed-cost calculations displayed on COVERLY are indicative only unless confirmed in a formal written quotation or purchase order issued by the supplier.",
        ],
      },
      {
        heading: "2. Independent Third-Party Businesses",
        body: [
          "Manufacturers, wholesalers, distributors, logistics partners, transporters and service providers listed on COVERLY are independent commercial entities. COVERLY does not guarantee product quality, stock availability, delivery timelines, regulatory certifications or financial solvency of any listed business.",
        ],
      },
      {
        heading: "3. No Legal, Tax or Financial Advice",
        body: [
          "Content published on COVERLY, including HS codes, GST percentages, procurement guides and sample workflows, is provided for general B2B informational purposes and does not constitute professional legal, customs, tax or accounting advice.",
        ],
      },
    ],
  },
  {
    slug: "acceptable-use-policy",
    path: "/acceptable-use-policy",
    title: "Acceptable Use Policy",
    category: "Core Governance",
    summary:
      "Standards of conduct, prohibited items, anti-spam rules and technical security requirements for all platform users.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Prohibited Conduct",
        body: [
          "Users must not post counterfeit, illegal, restricted or hazardous goods prohibited under Indian law; impersonate another company or submit forged GST/KYC documents; scrape private data; send unsolicited bulk spam; or attempt to bypass authentication, RBAC or Row-Level Security controls.",
        ],
      },
      {
        heading: "2. Listing Integrity & Fair Dealing",
        body: [
          "All product listings, RFQs, quotations, reviews and service proposals must represent genuine commercial intent. Submitting fake reviews, artificially manipulating quotes or posting misleading pricing is strictly prohibited and may result in immediate account suspension.",
        ],
      },
    ],
  },
  {
    slug: "buyer-terms",
    path: "/buyer-terms",
    title: "Buyer Terms of Use",
    category: "Marketplace Terms",
    summary:
      "Commercial rules and responsibilities for B2B buyers, retailers and procurement teams sourcing on COVERLY.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Genuine Sourcing Requirements",
        body: [
          "Buyers and retailers agree to submit accurate quantities, specifications, delivery locations and timelines when posting RFQs or sourcing enquiries.",
        ],
      },
      {
        heading: "2. Commercial Due Diligence & Internal Approvals",
        body: [
          "Buyers are responsible for configuring internal Procurement Manager, Purchase Staff and Finance permissions appropriately, verifying supplier credentials/samples prior to advance payments, and honoring valid purchase orders issued to suppliers.",
        ],
      },
    ],
  },
  {
    slug: "supplier-terms",
    path: "/supplier-terms",
    title: "Supplier Terms of Use",
    category: "Marketplace Terms",
    summary:
      "Listing, verification, quotation and fulfillment responsibilities for manufacturers, wholesalers and distributors.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Accurate Catalogues & Authorization",
        body: [
          "Suppliers warrant that all listed products, specifications, MOQ tiers, brand authorizations and factory capabilities are truthful, lawful and non-infringing.",
        ],
      },
      {
        heading: "2. Quotations, Tax Compliance & Fulfillment",
        body: [
          "Suppliers must honor valid accepted quotations, issue compliant GST tax invoices directly to buyers, maintain accurate order milestone updates and comply with applicable Indian manufacturing, packaging and trade regulations.",
        ],
      },
    ],
  },
  {
    slug: "business-services-terms",
    path: "/business-services-terms",
    title: "Business Services Terms",
    category: "Marketplace Terms",
    summary:
      "Rules governing professional agencies, consultants and business clients transacting on COVERLY Business Services.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Professional Qualifications & Deliverables",
        body: [
          "Service providers offering legal, CA/accounting, compliance, branding, IT or consulting services warrant that they hold all professional licenses and statutory registrations required under Indian law for the services offered.",
        ],
      },
      {
        heading: "2. Scope, Milestones & Confidentiality",
        body: [
          "Proposals should define clear scope of work, timelines, revision limits and milestone deliverables. Both client and provider must protect confidential business records exchanged during project execution.",
        ],
      },
    ],
  },
  {
    slug: "shipping-and-logistics-policy",
    path: "/shipping-and-logistics-policy",
    title: "Shipping & Logistics Policy",
    category: "Orders & Logistics",
    summary:
      "Responsibilities for B2B dispatch, freight estimates, e-Way bills, transporter bookings and Proof of Delivery.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Dispatch & Freight Responsibility",
        body: [
          "Shipping terms (Ex-Factory, FOR Destination, FOB, CIF, or buyer-arranged transport) are agreed directly between buyer, supplier and any engaged logistics partner or transporter.",
        ],
      },
      {
        heading: "2. Statutory Transport Documentation & Tracking",
        body: [
          "Consignors, suppliers and transporters are responsible for generating valid GST invoices, e-Way bills, lorry receipts (LR/GR), packing lists and customs documentation where applicable. Tracking milestones and electronic POD records on COVERLY reflect updates provided by the carrier/supplier.",
        ],
      },
    ],
  },
  {
    slug: "cancellation-policy",
    path: "/cancellation-policy",
    title: "Cancellation Policy",
    category: "Orders & Logistics",
    summary:
      "How RFQs, quotations, standard orders, custom manufacturing orders and service engagements may be cancelled.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. RFQs & Pending Orders",
        body: [
          "Buyers may withdraw open RFQs prior to accepting a quotation. Once a purchase order is confirmed, cancellation eligibility depends on production status and the mutually agreed quotation terms.",
        ],
      },
      {
        heading: "2. Custom Manufacturing & Dispatched Shipments",
        body: [
          "Orders that have entered custom production, custom packaging fabrication, quality inspection or dispatch cannot be unilaterally cancelled on the platform without supplier agreement and reconciliation of incurred costs.",
        ],
      },
    ],
  },
  {
    slug: "returns-and-disputes-policy",
    path: "/returns-and-disputes-policy",
    title: "Returns & Disputes Policy",
    category: "Orders & Logistics",
    summary:
      "Inspection windows, commercial returns for defective or non-conforming B2B goods, and dispute mediation.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Delivery Inspection & Claims",
        body: [
          "Buyers should inspect delivered consignments upon receipt, note visible transit damage on the delivery receipt/POD, and promptly document any quantity shortage or specification mismatch with photographic/weighment evidence.",
        ],
      },
      {
        heading: "2. Platform Dispute Mediation",
        body: [
          "Where buyer and supplier cannot resolve a commercial or service dispute directly, either party may log a formal dispute ticket through COVERLY Support for structured administrative mediation. COVERLY does not act as a judicial tribunal and parties retain their legal remedies.",
        ],
      },
    ],
  },
  {
    slug: "refund-policy",
    path: "/refund-policy",
    title: "Refund Policy",
    category: "Orders & Logistics",
    summary:
      "Terms governing refunds for B2B commercial settlements and any applicable COVERLY platform service fees.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Buyer-Supplier Commercial Settlements",
        body: [
          "Because commercial payments for goods, freight and professional services are settled according to buyer-supplier agreements, refunds for cancelled or returned B2B orders are governed by the confirmed quotation/PO terms between the transacting businesses.",
        ],
      },
      {
        heading: "2. Platform Subscription or Service Fees (If Applicable)",
        body: [
          "If COVERLY collects optional platform subscription or listing fees, any refund eligibility, pro-rata rules and billing dispute windows will be explicitly stated on the applicable checkout/order form prior to payment.",
        ],
      },
    ],
  },
  {
    slug: "intellectual-property-policy",
    path: "/intellectual-property-policy",
    title: "Intellectual Property Policy",
    category: "Rights & Compliance",
    summary:
      "Protection of trademarks, copyrights, brand authorizations and takedown notice procedures on COVERLY.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Respect for Third-Party IP Rights",
        body: [
          "Suppliers and distributors must not list counterfeit products or use third-party trademarks, logos, product photographs or technical drawings without authorization. Distributors claiming authorized brand representation may be required to provide authorization letters.",
        ],
      },
      {
        heading: "2. Infringement Takedown Notices",
        body: [
          `Rights holders may submit written IP infringement notices identifying the exact COVERLY URL, proof of IP ownership and contact information to ${LEGAL_PLACEHOLDERS.grievanceOfficer}. Verified infringing listings will be removed or restricted in accordance with applicable Indian IT Intermediary rules.`,
        ],
      },
    ],
  },
  {
    slug: "account-deletion-policy",
    path: "/account-deletion-policy",
    title: "Account Deletion & Data Retention Policy",
    category: "Rights & Compliance",
    summary:
      "Step-by-step instructions to deactivate or delete your COVERLY account and what statutory records must be retained.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. How to Request Account Deletion",
        body: [
          "Authenticated users can submit an account deletion or data export request directly from the Privacy Request tool below or via Account Settings. Alternatively, send a verified request from your registered email address to our Privacy Contact.",
        ],
      },
      {
        heading: "2. Verification, Timeline & Statutory Retention",
        body: [
          "Before permanently erasing an account, COVERLY verifies requester identity and checks for open orders, active disputes or pending compliance holds. Completed commercial invoices, tax/audit records and dispute logs may be retained in restricted archival form for the period mandated by Indian tax and corporate law, while personal profile fields are anonymized or deleted.",
        ],
      },
    ],
  },
  {
    slug: "grievance-redressal-policy",
    path: "/grievance-redressal-policy",
    title: "Grievance Redressal Policy",
    category: "Rights & Compliance",
    summary:
      "Designated Grievance Officer channel, escalation process and response timelines under Indian IT & DPDP frameworks.",
    version: DOC_VERSION,
    lastUpdated: DOC_DATE,
    sections: [
      {
        heading: "1. Submitting a Grievance",
        body: [
          "If you have a concern regarding privacy, personal data processing, abusive content, IP infringement, account suspension or unresolved platform disputes, please submit a formal grievance citing your account email, relevant URL/order reference and supporting details.",
        ],
      },
      {
        heading: "2. Grievance Officer Details & Resolution Timelines",
        body: [
          `Designated Grievance Officer: ${LEGAL_PLACEHOLDERS.grievanceOfficer}`,
          `Registered Office Address: ${LEGAL_PLACEHOLDERS.registeredAddress}`,
          "Target Acknowledgement: Within 24–48 business hours of receipt. Target Resolution: Within 15–30 days (or shorter statutory windows where specifically mandated under applicable IT Rules or DPDP Rules once notified).",
        ],
      },
    ],
  },
];

export function getLegalDocumentByPath(pathname: string): LegalDocument | undefined {
  const clean = pathname.replace(/\/+$/, "");
  return LEGAL_DOCUMENTS.find((d) => d.path === clean);
}
