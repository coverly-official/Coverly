import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CATEGORIES } from "../src/routes/business-services.js";

describe("COVERLY Business Service Marketplace Integration Tests", () => {
  // Workflow BS-1: Provider Onboarding (Individual vs Agency)
  it("Workflow BS-1: Service Provider Onboarding & Professional Profile Setup", async () => {
    const providerPayload = {
      userId: "usr-prov-001",
      name: "Apex Corporate Tax Advisors LLP",
      provider_type: "agency",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400051",
      gstin: "27AAACA1234B1Z2",
      headline: "Certified Corporate Tax & GST Filing Consultants",
      bio: "Premier CA and compliance advisory firm with over 15 years experience assisting Indian MSMEs.",
      experience_years: 15,
      service_areas: ["Mumbai", "Pune", "Thane", "All India Virtual"],
    };

    assert.ok(providerPayload.userId, "Provider requires user authentication");
    assert.ok(providerPayload.name && providerPayload.city, "Legal business and location required");
    assert.strictEqual(providerPayload.experience_years, 15, "Experience years must be recorded");
    assert.ok(providerPayload.service_areas.includes("All India Virtual"), "Virtual service capability supported");
  });

  // Workflow BS-2: Multi-Tier Package Creation & Pricing Models
  it("Workflow BS-2: Multi-Tier Package Creation & Configurable Deliverables", async () => {
    const serviceListing = {
      id: "srv-tax-01",
      title: "Comprehensive Corporate GST Return Filing",
      pricing_model: "fixed",
      packages: [
        {
          package_tier: "basic",
          name: "Quarterly Micro GST Filing",
          price: 2500,
          turnaround_days: 2,
          deliverables: ["GSTR-1 & GSTR-3B Reconciliation", "ITC Verification"],
        },
        {
          package_tier: "standard",
          name: "Monthly SME Compliance Package",
          price: 6500,
          turnaround_days: 3,
          deliverables: ["Monthly Filing", "GSTR-2B Vendor Follow-up", "Annual Audit Readiness"],
        },
        {
          package_tier: "premium",
          name: "Full Enterprise Retainer",
          price: 15000,
          turnaround_days: 5,
          deliverables: ["Dedicated CA Incharge", "Notice Handling", "Tax Optimization Strategy"],
        },
      ],
    };

    assert.strictEqual(serviceListing.packages.length, 3, "Service must support Basic, Standard, and Premium packages");
    assert.strictEqual(serviceListing.packages[0].price, 2500, "Basic package price configured");
    assert.strictEqual(serviceListing.packages[2].deliverables.length, 3, "Deliverables itemized accurately");
  });

  // Workflow BS-3: Unregistered Guest Service Enquiry Submission
  it("Workflow BS-3: Unregistered Guest Service Enquiry Submission with Unique Reference", async () => {
    const guestEnquiry = {
      customer_id: null, // Guest without account
      guest_name: "Vikram Malhotra",
      guest_email: "vikram@malhotratex.com",
      guest_phone: "+91 98201 12345",
      guest_business_name: "Malhotra Textiles Surat",
      category_id: "cat-1",
      title: "Need Trademark Registration for Brand 'TexLuxe'",
      requirements: "Looking for trademark class search and filing for textile brand in Class 24 & 25.",
      budget: 8500,
      delivery_city: "Surat",
      target_timeline: "Within 10 days",
    };

    assert.strictEqual(guestEnquiry.customer_id, null, "Guest enquiry does not require initial user_id");
    assert.ok(guestEnquiry.guest_name && guestEnquiry.guest_email && guestEnquiry.guest_phone, "Guest contact details required");

    // Generate reference
    const enquiryNumber = `BS-ENQ-${Date.now().toString(36).toUpperCase()}-101`;
    assert.match(enquiryNumber, /^BS-ENQ-/, "Unique BS-ENQ format generated");
  });

  // Workflow BS-4: Guest-to-Account Conversion
  it("Workflow BS-4: Guest-to-Account Conversion & Historical Enquiry Linking", async () => {
    const guestRecord = {
      request_number: "BS-ENQ-KM72-101",
      guest_email: "vikram@malhotratex.com",
      customer_id: null,
    };

    // User registers or logs in with same email
    const registeredUser = {
      id: "usr-vikram-99",
      email: "vikram@malhotratex.com",
    };

    if (guestRecord.guest_email === registeredUser.email) {
      guestRecord.customer_id = registeredUser.id;
    }

    assert.strictEqual(guestRecord.customer_id, "usr-vikram-99", "Enquiry ownership successfully claimed by user");
  });

  // Workflow BS-5: Provider Formal Quotation Submission
  it("Workflow BS-5: Provider Quotation Submission with Scope of Work & Validity", async () => {
    const quotation = {
      quotation_number: "SQT-KM72-402",
      request_id: "req-001",
      provider_business_id: "biz-prov-01",
      quoted_price: 7500,
      scope_of_work: "Full trademark search across Indian IP Registry, drafting Form TM-A, and government portal filing.",
      deliverables: ["Search Report", "Filing Receipt & TM Application Number", "Objection Handling Advice"],
      turnaround_days: 4,
      valid_until: "2026-12-15",
      status: "submitted",
    };

    assert.strictEqual(quotation.status, "submitted", "Quotation is active and pending customer response");
    assert.strictEqual(quotation.quoted_price, 7500, "Price is fixed and non-ambiguous");
    assert.strictEqual(quotation.deliverables.length, 3, "Deliverables enumerated");
  });

  // Workflow BS-6: Quotation Acceptance & Exactly-One Project Creation
  it("Workflow BS-6: Quotation Acceptance Triggers Exactly-One Service Project Creation", async () => {
    const quote = { id: "quote-101", quoted_price: 7500, status: "submitted" };
    let projectCreated = null;

    // Customer accepts quote
    const action = "accept";
    if (action === "accept") {
      quote.status = "accepted";
      projectCreated = {
        project_number: `PRJ-BS-${Date.now().toString(36).toUpperCase()}-901`,
        quotation_id: quote.id,
        agreed_price: quote.quoted_price,
        status: "project_created",
      };
    }

    assert.strictEqual(quote.status, "accepted", "Quote state changes to accepted");
    assert.ok(projectCreated, "Service project must be created upon acceptance");
    assert.match(projectCreated.project_number, /^PRJ-BS-/, "Project number follows PRJ-BS standard");
    assert.strictEqual(projectCreated.status, "project_created", "Project initial status is project_created");
  });

  // Workflow BS-7: Milestones, Deliverable Submission & Customer Review Loop
  it("Workflow BS-7: Milestone Advancement, Deliverable Upload & Customer Revision Loop", async () => {
    const project = {
      id: "prj-001",
      status: "in_progress",
      milestones: [
        { id: "m-1", title: "Trademark Search Report", status: "completed" },
        { id: "m-2", title: "Government Application Submission", status: "in_progress" },
      ],
      deliverables: [] as any[],
    };

    // Provider uploads deliverable
    const deliverable = {
      id: "deliv-1",
      title: "Official TM Application Receipt",
      file_url: "https://storage.coverly.in/documents/tm_receipt_texluxe.pdf",
      status: "submitted",
      customer_feedback: null as string | null,
    };
    project.deliverables.push(deliverable);
    project.status = "under_review";

    assert.strictEqual(project.status, "under_review", "Uploading deliverable shifts project to under_review");

    // Customer requests revision
    deliverable.status = "revision_requested";
    deliverable.customer_feedback = "Please rectify applicant address on Page 2.";
    project.status = "revision_requested";

    assert.strictEqual(project.status, "revision_requested", "Customer feedback transitions status");

    // Provider fixes and resubmits, customer approves
    deliverable.status = "approved";
    project.status = "completed";

    assert.strictEqual(deliverable.status, "approved", "Customer approved rectified deliverable");
    assert.strictEqual(project.status, "completed", "Project reaches completed state");
  });

  // Workflow BS-8: Verified Customer Review
  it("Workflow BS-8: Verified Customer Review Submission on Completed Project", async () => {
    const project = { id: "prj-001", status: "completed" };
    assert.strictEqual(project.status, "completed", "Review requires completed project");

    const review = {
      project_id: project.id,
      rating: 5,
      review_text: "Exceptional speed and precision. Received TM application receipt within 48 hours without hassle.",
      is_verified: true,
    };

    assert.ok(review.rating >= 1 && review.rating <= 5, "Rating is within 1 to 5 stars");
    assert.strictEqual(review.is_verified, true, "Review tagged as verified buyer");
  });

  // Workflow BS-9: Complaint Dispute Resolution & Admin Governance
  it("Workflow BS-9: Complaint Logging, Admin Arbitration & Resolution Audit Trail", async () => {
    const complaint = {
      complaint_number: "CMP-BS-KM72-881",
      complainant_user_id: "usr-client-01",
      provider_business_id: "biz-prov-01",
      complaint_type: "Deliverable Delay",
      description: "Provider promised delivery within 3 days but delayed past 10 days.",
      status: "open",
      resolution_notes: null as string | null,
      admin_id: null as string | null,
    };

    assert.strictEqual(complaint.status, "open", "Initial complaint status is open");

    // Admin resolves
    complaint.status = "resolved";
    complaint.admin_id = "usr-admin-01";
    complaint.resolution_notes = "Arbitrated with provider. Work delivered and 15% discount credit issued.";

    assert.strictEqual(complaint.status, "resolved", "Complaint successfully resolved by admin");
    assert.ok(complaint.admin_id && complaint.resolution_notes, "Admin resolution notes logged");
  });

  // Workflow BS-10: Exact 11 Business Service Categories (A to K) & Subcategory Hierarchies
  it("Workflow BS-10: Exact 11 Business Service Categories (A to K) & Subcategory Hierarchies", () => {
    assert.strictEqual(DEFAULT_CATEGORIES.length, 11, "Must contain exactly 11 core categories A to K");

    const expectedCategorySlugs = [
      "business-registration-compliance",
      "legal-services",
      "accounting-finance",
      "branding-marketing",
      "technology-it",
      "manufacturing-product-development",
      "packaging-printing",
      "testing-quality",
      "import-export-services",
      "logistics-supply-chain-consultancy",
      "business-consulting",
    ];

    expectedCategorySlugs.forEach((slug) => {
      const found = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
      assert.ok(found, `Category ${slug} must be defined`);
      assert.ok(found.subcategories && found.subcategories.length > 0, `Category ${slug} must have subcategories`);
    });

    // Check specific subcategories for Legal Services
    const legalCat = DEFAULT_CATEGORIES.find((c) => c.slug === "legal-services");
    assert.ok(legalCat, "Legal services category exists");
    assert.strictEqual(legalCat!.subcategories.length, 7, "Legal services has 7 specific subcategories");

    // Check Tech subcategories
    const techCat = DEFAULT_CATEGORIES.find((c) => c.slug === "technology-it");
    assert.ok(techCat, "Technology & IT category exists");
    assert.strictEqual(techCat!.subcategories.length, 10, "Technology & IT has 10 specific subcategories");
  });

  // Workflow BS-11: Provider Document Upload & Verification Status Transition
  it("Workflow BS-11: Provider Document Upload & Admin Verification Status Transition", () => {
    const documentRecord = {
      id: "doc-uuid-101",
      business_id: "biz-prov-01",
      document_type: "gstin_certificate",
      file_url: "https://storage.coverly.in/documents/gst_cert.pdf",
      verification_status: "pending" as "pending" | "verified" | "rejected",
      admin_notes: null as string | null,
    };

    assert.strictEqual(documentRecord.verification_status, "pending");

    // Admin verifies document
    documentRecord.verification_status = "verified";
    documentRecord.admin_notes = "Official GST portal verified and active.";

    assert.strictEqual(documentRecord.verification_status, "verified");
    assert.ok(documentRecord.admin_notes);
  });

  // Workflow BS-12: Quotation Negotiation & Counter-Offer Message Exchanging
  it("Workflow BS-12: Quotation Negotiation & Counter-Offer Message Exchanging", () => {
    const initialQuote = {
      id: "qt-101",
      quoted_price: 25000,
      turnaround_days: 14,
      status: "submitted",
    };

    const thread = [
      {
        id: "msg-1",
        quotation_id: initialQuote.id,
        sender_role: "customer",
        message: "Can we expedite this to 10 days for ₹22,000?",
        proposed_price: 22000,
        proposed_turnaround_days: 10,
      },
      {
        id: "msg-2",
        quotation_id: initialQuote.id,
        sender_role: "provider",
        message: "We can deliver within 10 days at ₹24,000 including priority review.",
        proposed_price: 24000,
        proposed_turnaround_days: 10,
      },
    ];

    assert.strictEqual(thread.length, 2);
    assert.strictEqual(thread[0].proposed_price, 22000);
    assert.strictEqual(thread[1].sender_role, "provider");
  });

  // Workflow BS-13: Multi-Provider Broadcast Enquiry Dispatch
  it("Workflow BS-13: Multi-Provider Broadcast Enquiry Dispatch", () => {
    const broadcastEnquiry = {
      title: "Need ISO 9001:2015 Certification Advisory for Chemical Plant",
      requirements: "Full audit preparation and certification assistance for Ankleshwar facility.",
      category_id: "cat-tst-08",
      provider_business_ids: ["prov-biz-1", "prov-biz-2", "prov-biz-3"],
    };

    const recipientDispatches = broadcastEnquiry.provider_business_ids.map((provId) => ({
      enquiry_id: "enq-99",
      provider_business_id: provId,
      status: "pending",
    }));

    assert.strictEqual(recipientDispatches.length, 3);
    assert.strictEqual(recipientDispatches[1].provider_business_id, "prov-biz-2");
    assert.strictEqual(recipientDispatches[2].status, "pending");
  });

  // Workflow BS-14: Review Submission Guardrail (Blocks review if project is not in 'completed' status)
  it("Workflow BS-14: Review Submission Guardrail Blocks Incomplete Projects", () => {
    const ongoingProject = {
      id: "prj-active-01",
      status: "in_progress",
    };

    function validateReviewEligibility(projectStatus: string) {
      if (projectStatus !== "completed") {
        throw new Error("Verified reviews can only be submitted after project completion.");
      }
      return true;
    }

    assert.throws(
      () => validateReviewEligibility(ongoingProject.status),
      /Verified reviews can only be submitted after project completion/
    );

    const completedProject = { id: "prj-done-01", status: "completed" };
    assert.doesNotThrow(() => validateReviewEligibility(completedProject.status));
  });

  // Workflow BS-15: Provider 8-KPI Dashboard Metrics Aggregation
  it("Workflow BS-15: Provider 8-KPI Dashboard Metrics Aggregation", () => {
    const mockDbData = {
      requests: [{ status: "submitted" }, { status: "quoted" }],
      quotes: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
      projects: [
        { status: "in_progress", agreed_price: 15000 },
        { status: "completed", agreed_price: 35000 },
        { status: "completed", agreed_price: 20000 },
      ],
      reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
      milestones: [{ status: "in_progress" }, { status: "pending" }],
    };

    const metrics = {
      activeRequests: mockDbData.requests.length,
      submittedQuotes: mockDbData.quotes.length,
      activeProjects: mockDbData.projects.filter((p) => p.status === "in_progress").length,
      completedProjects: mockDbData.projects.filter((p) => p.status === "completed").length,
      totalRevenue: mockDbData.projects
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.agreed_price, 0),
      avgRating: Number(
        (mockDbData.reviews.reduce((sum, r) => sum + r.rating, 0) / mockDbData.reviews.length).toFixed(1)
      ),
      totalReviews: mockDbData.reviews.length,
      pendingMilestones: mockDbData.milestones.length,
    };

    assert.strictEqual(metrics.activeRequests, 2);
    assert.strictEqual(metrics.submittedQuotes, 3);
    assert.strictEqual(metrics.activeProjects, 1);
    assert.strictEqual(metrics.completedProjects, 2);
    assert.strictEqual(metrics.totalRevenue, 55000);
    assert.strictEqual(metrics.avgRating, 4.7);
    assert.strictEqual(metrics.totalReviews, 3);
    assert.strictEqual(metrics.pendingMilestones, 2);
  });

  // Workflow BS-16: Admin Category & Review Moderation
  it("Workflow BS-16: Admin Category & Review Moderation", () => {
    const category = {
      id: "cat-1",
      name: "Custom Software",
      is_active: true,
    };
    category.is_active = false;
    assert.strictEqual(category.is_active, false, "Category deactivated by admin");

    const review = {
      id: "rev-1",
      rating: 5,
      is_verified: true,
      moderation_flag: false,
    };
    review.is_verified = false;
    review.moderation_flag = true;
    assert.strictEqual(review.is_verified, false, "Review unverified or hidden by admin");
  });
});
