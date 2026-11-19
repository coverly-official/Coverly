import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  issueOtp,
  verifyOtp,
  validateAndConsumeRecoveryToken,
  clearMemoryChallenges,
  generateCryptoOtp,
} from "../src/modules/auth/otp.service.js";
import {
  sendWelcomeEmail,
  sendEmailVerificationOtp,
  sendGoogleVerificationOtp,
  sendForgotPasswordOtp,
  sendPasswordChangedNotification,
  getSentEmails,
  getLatestEmailFor,
  clearSentEmails,
  maskEmail,
} from "../src/modules/email/email.service.js";
import {
  authenticateWithGoogle,
  verifyGoogleToken,
} from "../src/modules/auth/google.service.js";

describe("COVERLY Centralized Authentication, OTP & Password Recovery", () => {
  beforeEach(() => {
    clearMemoryChallenges();
    clearSentEmails();
  });

  describe("1. Cryptographic OTP Generation & Masking", () => {
    it("generates a strictly 6-digit numeric OTP between 100000 and 999999", () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateCryptoOtp();
        assert.equal(otp.length, 6, `Expected 6 digits, got: ${otp}`);
        const num = Number(otp);
        assert.ok(num >= 100000 && num <= 999999, `Expected between 100000 and 999999, got: ${num}`);
      }
    });

    it("correctly masks email destinations for privacy", () => {
      assert.equal(maskEmail("vinay@company.com"), "v***y@company.com");
      assert.equal(maskEmail("admin@coverly.com"), "a***n@coverly.com");
      assert.equal(maskEmail("ab@xyz.in"), "a***@xyz.in");
      assert.equal(maskEmail("invalid-email"), "***@***.***");
    });
  });

  describe("2. Email OTP Issuance, Expiry & 30s Resend Cooldown", () => {
    it("issues a secure hashed OTP with 5m expiry and 30s resend cooldown", async () => {
      const email = "procurement@steelworks.in";
      const res = await issueOtp({
        email,
        purpose: "email_verification",
        userId: "user-123",
      });

      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.otp.length, 6);
        assert.equal(res.data.expiresInSeconds, 300); // 5 minutes
        assert.equal(res.data.resendCooldownSeconds, 30); // 30 seconds
        assert.equal(res.data.maskedDestination, "p***t@steelworks.in");
      }
    });

    it("enforces 30s cooldown and blocks immediate OTP resend with 429", async () => {
      const email = "buyer@surattextiles.com";

      // First OTP
      const first = await issueOtp({ email, purpose: "email_verification" });
      assert.equal(first.success, true);

      // Immediate second request within 30s
      const second = await issueOtp({ email, purpose: "email_verification" });
      assert.equal(second.success, false);
      if (!second.success) {
        assert.equal(second.errorCode, "RESEND_COOLDOWN_ACTIVE");
        assert.ok((second.retryAfterSeconds || 0) > 0);
        assert.match(second.errorMessage, /wait \d+ seconds/);
      }
    });

    it("verifies valid OTP and marks it consumed so it cannot be reused", async () => {
      const email = "rajkot@machinetools.org";
      const issued = await issueOtp({ email, purpose: "email_verification" });
      assert.equal(issued.success, true);
      if (!issued.success) return;

      const otp = issued.data.otp;

      // First verification: SUCCESS
      const verified = await verifyOtp(email, otp, "email_verification");
      assert.equal(verified.valid, true);

      // Second verification with the same OTP: REJECTED (Already consumed)
      const secondTry = await verifyOtp(email, otp, "email_verification");
      assert.equal(secondTry.valid, false);
      assert.equal(secondTry.errorCode, "ALREADY_CONSUMED");
    });

    it("rejects incorrect OTP, decrements attempts, and locks after 5 failed tries", async () => {
      const email = "distributor@chemicals.co";
      const issued = await issueOtp({ email, purpose: "email_verification" });
      assert.equal(issued.success, true);
      if (!issued.success) return;

      const wrongOtp = "000000";

      // Try 1
      let res = await verifyOtp(email, wrongOtp, "email_verification");
      assert.equal(res.valid, false);
      assert.equal(res.errorCode, "INVALID_OTP");
      assert.equal(res.attemptsRemaining, 4);

      // Try 2, 3, 4
      await verifyOtp(email, wrongOtp, "email_verification");
      await verifyOtp(email, wrongOtp, "email_verification");
      await verifyOtp(email, wrongOtp, "email_verification");

      // Try 5: Final attempt exhaustion
      res = await verifyOtp(email, wrongOtp, "email_verification");
      assert.equal(res.valid, false);
      assert.equal(res.errorCode, "MAX_ATTEMPTS_EXCEEDED");
      assert.equal(res.attemptsRemaining, 0);

      // Even correct OTP is now blocked because challenge is locked
      const blocked = await verifyOtp(email, issued.data.otp, "email_verification");
      assert.equal(blocked.valid, false);
      assert.equal(blocked.errorCode, "ALREADY_CONSUMED");
    });
  });

  describe("3. Branded Email Templates & Dispatch Audit", () => {
    it("dispatches branded email verification email with official branding", async () => {
      const email = "factory@puneauto.in";
      const res = await sendEmailVerificationOtp({
        email,
        name: "Vikram Sharma",
        otp: "583921",
        expiresInMinutes: 5,
      });

      assert.equal(res.success, true);
      const queued = getLatestEmailFor(email);
      assert.ok(queued);
      assert.equal(queued?.to, email);
      assert.equal(queued?.subject, "Verify Your COVERLY Account");
      assert.match(queued?.html || "", /583921/);
      assert.match(queued?.html || "", /COVERLY/);
      assert.match(queued?.html || "", /logo-horizontal\.png/);
      assert.match(queued?.html || "", /B2B Sourcing/);
      assert.match(queued?.text || "", /583921/);
    });

    it("dispatches welcome email and password changed notification", async () => {
      const email = "founder@msmehub.in";

      await sendWelcomeEmail({ email, name: "Pooja Patel", role: "wholesaler" });
      let queued = getLatestEmailFor(email);
      assert.ok(queued);
      assert.equal(queued?.subject, "Welcome to COVERLY — India's Verified B2B Marketplace");

      await sendPasswordChangedNotification({ email, name: "Pooja Patel" });
      queued = getLatestEmailFor(email);
      assert.ok(queued);
      assert.equal(queued?.subject, "Security Alert: Your COVERLY Password Has Been Changed");
    });
  });

  describe("4. Password Recovery & Single-Use Token Flow", () => {
    it("executes complete 3-step password recovery flow", async () => {
      const email = "cfo@steelpipes.com";

      // Step 1: Issue recovery OTP
      const issued = await issueOtp({ email, purpose: "password_recovery" });
      assert.equal(issued.success, true);
      if (!issued.success) return;

      const recoveryOtp = issued.data.otp;

      // Step 2: Verify recovery OTP -> Generates 15m single-use recoveryToken
      const verified = await verifyOtp(email, recoveryOtp, "password_recovery");
      assert.equal(verified.valid, true);
      assert.ok(verified.recoveryToken, "Expected single-use recovery token");
      const recoveryToken = verified.recoveryToken!;

      // Step 3: Consume recovery token to reset password
      const consumed = await validateAndConsumeRecoveryToken(email, recoveryToken);
      assert.equal(consumed.valid, true);

      // Step 4: Token cannot be reused a second time (Single-use security guarantee)
      const secondUse = await validateAndConsumeRecoveryToken(email, recoveryToken);
      assert.equal(secondUse.valid, false);
      assert.match(secondUse.errorMessage || "", /Invalid or expired recovery session/);
    });
  });

  describe("5. Google OAuth Identity & Independent OTP Requirement", () => {
    it("validates Google identity token claims correctly", async () => {
      const validPayload = {
        sub: "google-10928374",
        email: "partner@google-domain.com",
        email_verified: true,
        name: "Anand Verma",
        iss: "accounts.google.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockToken = `header.${Buffer.from(JSON.stringify(validPayload)).toString("base64url")}.signature`;
      const claims = await verifyGoogleToken(mockToken);

      assert.ok(claims);
      assert.equal(claims?.sub, "google-10928374");
      assert.equal(claims?.email, "partner@google-domain.com");
      assert.equal(claims?.email_verified, true);
      assert.equal(claims?.name, "Anand Verma");
    });

    it("rejects Google tokens where email is not verified by Google", async () => {
      const unverifiedPayload = {
        sub: "google-fake-123",
        email: "hacker@unverified.com",
        email_verified: false,
        name: "Fake User",
        iss: "accounts.google.com",
      };

      const mockToken = `header.${Buffer.from(JSON.stringify(unverifiedPayload)).toString("base64url")}.signature`;
      const claims = await verifyGoogleToken(mockToken);
      assert.equal(claims, null);
    });

    it("enforces COVERLY application-level OTP verification on Google Sign-In", async () => {
      const email = `new-google-user-${Date.now()}@domain.com`;
      const validPayload = {
        sub: `google-${Date.now()}`,
        email,
        email_verified: true,
        name: "Deepak Sourcing",
        iss: "accounts.google.com",
      };

      const mockToken = `header.${Buffer.from(JSON.stringify(validPayload)).toString("base64url")}.signature`;
      const authResult = await authenticateWithGoogle(mockToken);

      assert.equal(authResult.success, true);
      // Crucial: Google's email_verified does NOT bypass COVERLY application-level OTP!
      assert.equal(authResult.requiresOtp, true);
      assert.equal(authResult.user?.email_verified, false);
      assert.equal(authResult.resendCooldownSeconds, 30);

      // Verify that Google verification OTP was dispatched
      const queued = getLatestEmailFor(email);
      assert.ok(queued);
      assert.equal(queued?.subject, "Verify Your Email for Google Sign-In — COVERLY");
    });
  });
});
