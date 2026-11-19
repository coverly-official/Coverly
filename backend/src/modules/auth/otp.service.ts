import crypto from "node:crypto";
import { getInsForgeClient } from "../../lib/insforge.js";
import { hashDestination, maskEmail } from "../email/email.service.js";

export type OtpPurpose =
  | "email_verification"
  | "google_verification"
  | "password_recovery"
  | "login_verification"
  | "email_change"
  | "mobile_verification";

export interface IssueOtpOptions {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
  ipAddress?: string;
}

export interface IssueOtpResult {
  challengeId: string;
  otp: string; // Plaintext returned ONLY to caller for immediate transmission via email
  maskedDestination: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  resendAvailableAt: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  errorCode?: "OTP_NOT_FOUND" | "OTP_EXPIRED" | "MAX_ATTEMPTS_EXCEEDED" | "INVALID_OTP" | "ALREADY_CONSUMED";
  errorMessage?: string;
  attemptsRemaining?: number;
  challengeId?: string;
  userId?: string;
  recoveryToken?: string; // Generated only for password_recovery
}

// In-memory fallback challenge store for tests and fast-path lookup
interface MemoryChallenge {
  id: string;
  userId?: string;
  destinationHash: string;
  maskedDestination: string;
  purpose: string;
  salt: string;
  hash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  resendAvailableAt: number;
  consumedAt?: number;
  recoveryTokenHash?: string;
  recoveryTokenExpiresAt?: number;
  ipHash?: string;
  createdAt: number;
}

const memoryChallenges = new Map<string, MemoryChallenge>();

// Rate-limiting tracker: destinationHash -> array of timestamps
const rateLimitTracker = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 6;

function checkRateLimit(destHash: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = (rateLimitTracker.get(destHash) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestInWindow)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  rateLimitTracker.set(destHash, timestamps);
  return { allowed: true };
}

export function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(otp.trim()).digest("hex");
}

export function generateCryptoOtp(): string {
  // Cryptographically secure 6-digit integer from 100000 to 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Issues a new 6-digit numeric OTP:
 * - Checks 30s resend cooldown for the destination and purpose
 * - Invalidates all previous active OTPs for the same destination + purpose
 * - Generates cryptographically secure 6-digit OTP
 * - Hashes OTP with unique cryptographic salt before storing
 * - Returns plaintext OTP ONLY in return object (NEVER logged)
 */
export async function issueOtp(options: IssueOtpOptions): Promise<
  | { success: true; data: IssueOtpResult }
  | { success: false; errorCode: string; errorMessage: string; retryAfterSeconds?: number }
> {
  const normalizedEmail = options.email.trim().toLowerCase();
  const destHash = hashDestination(normalizedEmail);
  const maskedDest = maskEmail(normalizedEmail);
  const purpose = options.purpose;
  const ipHash = options.ipAddress
    ? crypto.createHash("sha256").update(options.ipAddress).digest("hex")
    : undefined;

  const now = Date.now();

  // 1. Check Cooldown (30 seconds)
  const existingList = Array.from(memoryChallenges.values()).filter(
    (c) => c.destinationHash === destHash && c.purpose === purpose && !c.consumedAt
  );

  const activeExisting = existingList.sort((a, b) => b.createdAt - a.createdAt)[0];
  if (activeExisting && activeExisting.resendAvailableAt > now) {
    const cooldownRemaining = Math.ceil((activeExisting.resendAvailableAt - now) / 1000);
    return {
      success: false,
      errorCode: "RESEND_COOLDOWN_ACTIVE",
      errorMessage: `Please wait ${cooldownRemaining} seconds before requesting another code.`,
      retryAfterSeconds: cooldownRemaining,
    };
  }

  // 2. Check Hourly Rate Limit
  const rateCheck = checkRateLimit(destHash);
  if (!rateCheck.allowed) {
    return {
      success: false,
      errorCode: "RATE_LIMIT_EXCEEDED",
      errorMessage: `Too many verification requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    };
  }

  // 3. Invalidate/Consume all previous OTPs for this destination and purpose
  existingList.forEach((c) => {
    c.consumedAt = now;
  });

  const insforge = getInsForgeClient();
  if (insforge) {
    try {
      await insforge.database
        .from("otp_challenges")
        .update({ consumed_at: new Date(now).toISOString() })
        .eq("destination_hash", destHash)
        .eq("purpose", purpose)
        .is("consumed_at", null);
    } catch {
      // Non-blocking in dev/test fallback
    }
  }

  // 4. Generate fresh 6-digit OTP & salt
  const otp = generateCryptoOtp();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHash = hashOtp(otp, salt);
  const challengeId = crypto.randomUUID();

  const expiresInMs = 5 * 60 * 1000; // 5 minutes
  const cooldownMs = 30 * 1000; // 30 seconds
  const expiresAt = now + expiresInMs;
  const resendAvailableAt = now + cooldownMs;

  const challengeRecord: MemoryChallenge = {
    id: challengeId,
    userId: options.userId,
    destinationHash: destHash,
    maskedDestination: maskedDest,
    purpose,
    salt,
    hash: otpHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt,
    resendAvailableAt,
    ipHash,
    createdAt: now,
  };

  memoryChallenges.set(challengeId, challengeRecord);

  // Persist to database (NO plaintext OTP)
  if (insforge) {
    try {
      await insforge.database.from("otp_challenges").insert([
        {
          id: challengeId,
          user_id: options.userId || null,
          channel: "email",
          destination_hash: destHash,
          masked_destination: maskedDest,
          otp_salt: salt,
          otp_hash: otpHash,
          purpose,
          attempts: 0,
          max_attempts: 5,
          expires_at: new Date(expiresAt).toISOString(),
          resend_available_at: new Date(resendAvailableAt).toISOString(),
          ip_hash: ipHash || null,
        },
      ]);
    } catch {
      // Non-blocking fallback
    }
  }

  return {
    success: true,
    data: {
      challengeId,
      otp, // Provided to caller to transmit via email
      maskedDestination: maskedDest,
      expiresInSeconds: Math.ceil(expiresInMs / 1000),
      resendCooldownSeconds: 30,
      resendAvailableAt: new Date(resendAvailableAt).toISOString(),
    },
  };
}

/**
 * Verifies a submitted 6-digit OTP against active challenges:
 * - Compares with timing-safe comparison
 * - Enforces 5-minute expiry
 * - Enforces 5 maximum attempts
 * - Consumes challenge on success
 * - For password_recovery, issues single-use recoveryToken with 15m validity
 */
export async function verifyOtp(
  email: string,
  submittedOtp: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const destHash = hashDestination(normalizedEmail);
  const cleanOtp = submittedOtp.trim();

  const now = Date.now();

  // Find latest active challenge for this email and purpose
  let challenge = Array.from(memoryChallenges.values())
    .filter(
      (c) =>
        c.destinationHash === destHash &&
        (c.purpose === purpose || (purpose === "email_verification" && c.purpose === "google_verification"))
    )
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  // If not found in memory, attempt database lookup
  const insforge = getInsForgeClient();
  if (!challenge && insforge) {
    try {
      const { data } = await insforge.database
        .from("otp_challenges")
        .select("*")
        .eq("destination_hash", destHash)
        .eq("purpose", purpose)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        challenge = {
          id: data.id,
          userId: data.user_id,
          destinationHash: data.destination_hash,
          maskedDestination: data.masked_destination,
          purpose: data.purpose,
          salt: data.otp_salt,
          hash: data.otp_hash,
          attempts: data.attempts || 0,
          maxAttempts: data.max_attempts || 5,
          expiresAt: new Date(data.expires_at).getTime(),
          resendAvailableAt: data.resend_available_at ? new Date(data.resend_available_at).getTime() : 0,
          consumedAt: data.consumed_at ? new Date(data.consumed_at).getTime() : undefined,
          recoveryTokenHash: data.recovery_token_hash,
          recoveryTokenExpiresAt: data.recovery_token_expires_at
            ? new Date(data.recovery_token_expires_at).getTime()
            : undefined,
          createdAt: new Date(data.created_at).getTime(),
        };
        memoryChallenges.set(challenge.id, challenge);
      }
    } catch {
      // Ignore DB read failure
    }
  }

  if (!challenge) {
    return {
      valid: false,
      errorCode: "OTP_NOT_FOUND",
      errorMessage: "No active verification code found for this email. Please request a new code.",
    };
  }

  if (challenge.consumedAt) {
    return {
      valid: false,
      errorCode: "ALREADY_CONSUMED",
      errorMessage: "This verification code has already been used. Please request a new code.",
    };
  }

  if (now > challenge.expiresAt) {
    challenge.consumedAt = now;
    return {
      valid: false,
      errorCode: "OTP_EXPIRED",
      errorMessage: "This verification code has expired (5-minute limit). Please request a fresh code.",
    };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.consumedAt = now;
    return {
      valid: false,
      errorCode: "MAX_ATTEMPTS_EXCEEDED",
      errorMessage: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  // Calculate hash of submitted OTP
  const expectedHash = challenge.hash;
  const actualHash = hashOtp(cleanOtp, challenge.salt);

  const hashesMatch =
    expectedHash.length === actualHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(actualHash, "hex"));

  if (!hashesMatch) {
    challenge.attempts += 1;
    const remaining = Math.max(0, challenge.maxAttempts - challenge.attempts);

    if (insforge) {
      try {
        await insforge.database
          .from("otp_challenges")
          .update({ attempts: challenge.attempts })
          .eq("id", challenge.id);
      } catch {}
    }

    if (remaining === 0) {
      challenge.consumedAt = now;
      return {
        valid: false,
        errorCode: "MAX_ATTEMPTS_EXCEEDED",
        errorMessage: "Maximum verification attempts exceeded. For security, please request a new code.",
        attemptsRemaining: 0,
      };
    }

    return {
      valid: false,
      errorCode: "INVALID_OTP",
      errorMessage: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      attemptsRemaining: remaining,
    };
  }

  // OTP is valid! Mark challenge consumed
  challenge.consumedAt = now;

  let recoveryToken: string | undefined;
  if (purpose === "password_recovery") {
    // Generate single-use random 32-byte recovery token
    recoveryToken = crypto.randomBytes(32).toString("hex");
    const recoveryTokenHash = crypto.createHash("sha256").update(recoveryToken).digest("hex");
    const recoveryTokenExpiresAt = now + 15 * 60 * 1000; // 15 minutes to reset password

    challenge.recoveryTokenHash = recoveryTokenHash;
    challenge.recoveryTokenExpiresAt = recoveryTokenExpiresAt;

    if (insforge) {
      try {
        await insforge.database
          .from("otp_challenges")
          .update({
            consumed_at: new Date(now).toISOString(),
            recovery_token_hash: recoveryTokenHash,
            recovery_token_expires_at: new Date(recoveryTokenExpiresAt).toISOString(),
          })
          .eq("id", challenge.id);
      } catch {}
    }
  } else if (insforge) {
    try {
      await insforge.database
        .from("otp_challenges")
        .update({ consumed_at: new Date(now).toISOString() })
        .eq("id", challenge.id);
    } catch {}
  }

  return {
    valid: true,
    challengeId: challenge.id,
    userId: challenge.userId,
    recoveryToken,
  };
}

/**
 * Validates and consumes a single-use password recovery token
 */
export async function validateAndConsumeRecoveryToken(
  email: string,
  recoveryToken: string
): Promise<{ valid: boolean; errorMessage?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const destHash = hashDestination(normalizedEmail);
  const tokenHash = crypto.createHash("sha256").update(recoveryToken.trim()).digest("hex");
  const now = Date.now();

  let challenge = Array.from(memoryChallenges.values()).find(
    (c) =>
      c.destinationHash === destHash &&
      c.recoveryTokenHash === tokenHash &&
      c.recoveryTokenExpiresAt &&
      c.recoveryTokenExpiresAt > now
  );

  const insforge = getInsForgeClient();
  if (!challenge && insforge) {
    try {
      const { data } = await insforge.database
        .from("otp_challenges")
        .select("*")
        .eq("destination_hash", destHash)
        .eq("recovery_token_hash", tokenHash)
        .gte("recovery_token_expires_at", new Date(now).toISOString())
        .limit(1)
        .single();

      if (data) {
        challenge = {
          id: data.id,
          userId: data.user_id,
          destinationHash: data.destination_hash,
          maskedDestination: data.masked_destination,
          purpose: data.purpose,
          salt: data.otp_salt,
          hash: data.otp_hash,
          attempts: data.attempts || 0,
          maxAttempts: data.max_attempts || 5,
          expiresAt: new Date(data.expires_at).getTime(),
          resendAvailableAt: 0,
          consumedAt: data.consumed_at ? new Date(data.consumed_at).getTime() : undefined,
          recoveryTokenHash: data.recovery_token_hash,
          recoveryTokenExpiresAt: new Date(data.recovery_token_expires_at).getTime(),
          createdAt: new Date(data.created_at).getTime(),
        };
      }
    } catch {}
  }

  if (!challenge) {
    return {
      valid: false,
      errorMessage: "Invalid or expired recovery session. Please request a new password recovery code.",
    };
  }

  // Consume recovery token so it cannot be reused
  challenge.recoveryTokenHash = undefined;
  challenge.recoveryTokenExpiresAt = undefined;

  if (insforge) {
    try {
      await insforge.database
        .from("otp_challenges")
        .update({
          recovery_token_hash: null,
          recovery_token_expires_at: null,
        })
        .eq("id", challenge.id);
    } catch {}
  }

  return { valid: true };
}

export function clearMemoryChallenges(): void {
  memoryChallenges.clear();
  rateLimitTracker.clear();
}
