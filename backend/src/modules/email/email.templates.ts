/**
 * COVERLY Branded Responsive HTML Email Templates
 *
 * Visual Identity:
 * - Brand: COVERLY
 * - Product identity: B2B SOURCING
 * - Colors: Navy Blue (#0F172A), Royal Blue (#2563EB, #4F6FFD), Crisp White (#FFFFFF), Slate (#475569)
 * - Official logo branding & clear security notices
 */

const BASE_URL = process.env.PUBLIC_APP_URL || "https://coverly-indol.vercel.app";
const LOGO_URL = `${BASE_URL}/brand/logo-horizontal.png`;

function baseEmailWrapper(title: string, preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; }
    .email-container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background-color: #0F172A; padding: 28px 32px; text-align: left; }
    .header-logo { height: 36px; width: auto; display: block; border: 0; }
    .header-tagline { color: #94A3B8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; }
    .body { padding: 36px 32px; }
    .title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 16px 0; letter-spacing: -0.02em; }
    .lead { font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0; }
    .otp-card { background-color: #EEF2FF; border: 1.5px dashed #4F6FFD; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #4338CA; margin-bottom: 8px; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1E3A8A; margin: 0; }
    .otp-meta { font-size: 12px; font-weight: 600; color: #6366F1; margin-top: 8px; }
    .notice { background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 12px; line-height: 1.5; color: #92400E; margin: 24px 0; }
    .btn { display: inline-block; background-color: #0F172A; color: #FFFFFF !important; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
    .signature { font-size: 13px; color: #475569; line-height: 1.6; margin-top: 32px; border-top: 1px solid #F1F5F9; pt-4; padding-top: 20px; }
    .footer { background-color: #F8FAFC; padding: 24px 32px; font-size: 11px; color: #64748B; line-height: 1.5; border-top: 1px solid #E2E8F0; text-align: center; }
    .footer a { color: #2563EB; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <img src="${LOGO_URL}" alt="COVERLY" class="header-logo" style="height:34px; max-width:200px;" />
            <div class="header-tagline">B2B Sourcing & Landed-Cost Procurement Platform</div>
          </div>

          <!-- Body -->
          <div class="body">
            ${contentHtml}

            <!-- Signature -->
            <div class="signature">
              Regards,<br />
              <strong>COVERLY Team</strong><br />
              <span style="font-size: 11px; color: #64748B;">B2B Wholesale & Procurement Platform</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 8px 0;">
              © ${new Date().getFullYear()} COVERLY Technologies. All rights reserved.
            </p>
            <p style="margin: 0 0 8px 0;">
              This is a secure system notification sent from COVERLY. If you did not make this request, please contact
              <a href="mailto:security@coverly.com">security@coverly.com</a> immediately.
            </p>
            <p style="margin: 0;">
              <a href="${BASE_URL}/legal">Legal Center</a> •
              <a href="${BASE_URL}/privacy-policy">Privacy Policy</a> •
              <a href="${BASE_URL}/terms">Terms of Service</a>
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 1. Welcome to COVERLY
 */
export function renderWelcomeEmail(params: { name: string; email: string; role?: string }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const subject = "Welcome to COVERLY — India's Verified B2B Marketplace";
  const preheader = "Welcome to COVERLY. Your B2B wholesale sourcing account has been created.";

  const content = `
    <h1 class="title">Welcome to COVERLY, ${name}!</h1>
    <p class="lead">
      We're excited to partner with you. COVERLY connects verified Indian manufacturers, wholesalers, distributors,
      and procurement buyers with zero brokerage and transparent landed-cost calculations.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Your Registered Account Details:</div>
      <div style="font-size: 13px; color: #334155;"><strong>Email:</strong> ${escapeHtml(params.email)}</div>
      ${params.role ? `<div style="font-size: 13px; color: #334155; margin-top: 4px;"><strong>Account Type:</strong> ${escapeHtml(params.role).toUpperCase()}</div>` : ""}
    </div>
    <p class="lead">
      To unlock all platform capabilities — including posting RFQs, comparing supplier quotations, and generating Purchase Orders — please ensure your email is verified.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${BASE_URL}/auth/login" class="btn">Access Your Workspace</a>
    </div>
  `;

  const text = `Hello ${params.name},\n\nWelcome to COVERLY.\nYour B2B sourcing account (${params.email}) is ready.\n\nSign in to your workspace: ${BASE_URL}/auth/login\n\nRegards,\nCOVERLY Team\nB2B Sourcing Platform`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 2. Email Verification OTP
 */
export function renderEmailVerificationOtp(params: { name: string; otp: string; expiresInMinutes?: number }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const expiry = params.expiresInMinutes || 5;
  const subject = "Verify Your COVERLY Account";
  const preheader = `Your COVERLY email verification code is ${params.otp}. Expires in ${expiry} minutes.`;

  const content = `
    <h1 class="title">Verify Your Email Address</h1>
    <p class="lead">
      Hello ${name},<br />
      Welcome to COVERLY. Use the following One-Time Password (OTP) to verify your business email address:
    </p>

    <div class="otp-card">
      <div class="otp-label">Six-Digit Verification Code</div>
      <div class="otp-code">${escapeHtml(params.otp)}</div>
      <div class="otp-meta">Valid for ${expiry} minutes • Single-use code</div>
    </div>

    <div class="notice">
      <strong>Security Notice:</strong> Never share this OTP with anyone, including COVERLY representatives.
      COVERLY will never call or message you asking for your verification code.
    </div>

    <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
      If you did not register for a COVERLY account, please disregard this email.
    </p>
  `;

  const text = `Hello ${params.name},\n\nWelcome to COVERLY.\n\nUse the following OTP to verify your email address:\n\n${params.otp}\n\nThis OTP expires in ${expiry} minutes.\n\nFor security reasons, never share this OTP with anyone.\n\nRegards,\nCOVERLY Team\nB2B Sourcing Platform`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 3. Google Login Email Verification OTP
 */
export function renderGoogleVerificationOtp(params: { name: string; otp: string; expiresInMinutes?: number }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const expiry = params.expiresInMinutes || 5;
  const subject = "Verify Your Email for Google Sign-In — COVERLY";
  const preheader = `Your COVERLY Google Sign-In verification code is ${params.otp}.`;

  const content = `
    <h1 class="title">Complete Google Sign-In Verification</h1>
    <p class="lead">
      Hello ${name},<br />
      You recently signed in to COVERLY using your Google account. In accordance with COVERLY platform compliance
      and enterprise KYC standards, please verify ownership of this email address to activate your workspace.
    </p>

    <div class="otp-card">
      <div class="otp-label">Google Login Verification OTP</div>
      <div class="otp-code">${escapeHtml(params.otp)}</div>
      <div class="otp-meta">Expires in ${expiry} minutes</div>
    </div>

    <div class="notice">
      <strong>Application-Level Verification:</strong> COVERLY requires independent email OTP verification
      for all accounts to protect business communications and transaction records.
    </div>

    <p style="font-size: 13px; color: #64748B;">
      If you did not initiate Google authentication with COVERLY, please secure your Google account immediately.
    </p>
  `;

  const text = `Hello ${params.name},\n\nYou signed in to COVERLY using Google.\nUse the following OTP to complete application-level verification:\n\n${params.otp}\n\nExpires in ${expiry} minutes.\nNever share this code with anyone.\n\nRegards,\nCOVERLY Team`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 4. Forgot Password OTP
 */
export function renderForgotPasswordOtp(params: { name: string; otp: string; expiresInMinutes?: number }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const expiry = params.expiresInMinutes || 5;
  const subject = "Reset Your COVERLY Password — OTP Code";
  const preheader = `Your COVERLY password recovery code is ${params.otp}.`;

  const content = `
    <h1 class="title">Password Recovery Request</h1>
    <p class="lead">
      Hello ${name},<br />
      We received a request to reset the password for your COVERLY account.
      Enter the 6-digit verification code below to confirm your identity and proceed with creating a new password:
    </p>

    <div class="otp-card">
      <div class="otp-label">Password Recovery OTP</div>
      <div class="otp-code">${escapeHtml(params.otp)}</div>
      <div class="otp-meta">Valid for ${expiry} minutes • Single-use code</div>
    </div>

    <div class="notice">
      <strong>Didn't request this?</strong> If you did not request a password reset, your account is still secure.
      Do NOT share this OTP with anyone. You may safely disregard this message.
    </div>
  `;

  const text = `Hello ${params.name},\n\nWe received a password reset request for your COVERLY account.\n\nYour recovery code is: ${params.otp}\n\nValid for ${expiry} minutes.\n\nIf you did not request this, please ignore this email.\n\nRegards,\nCOVERLY Team`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 5. Password Successfully Changed
 */
export function renderPasswordChangedNotification(params: { name: string; timestamp?: string; deviceHint?: string }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const time = params.timestamp || new Date().toUTCString();
  const subject = "Security Alert: Your COVERLY Password Has Been Changed";
  const preheader = "Your COVERLY account password was recently updated.";

  const content = `
    <h1 class="title">Password Changed Successfully</h1>
    <p class="lead">
      Hello ${name},<br />
      This is a confirmation that the password for your COVERLY account was successfully updated on <strong>${escapeHtml(time)}</strong>.
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <div style="font-size: 13px; color: #334155;"><strong>Status:</strong> Password successfully changed</div>
      <div style="font-size: 13px; color: #334155; margin-top: 4px;"><strong>Time:</strong> ${escapeHtml(time)}</div>
      ${params.deviceHint ? `<div style="font-size: 13px; color: #334155; margin-top: 4px;"><strong>Client:</strong> ${escapeHtml(params.deviceHint)}</div>` : ""}
    </div>

    <div class="notice">
      <strong>Did not make this change?</strong> If you did NOT change your password, someone may have unauthorized access
      to your account. Please reset your password immediately and contact
      <a href="mailto:security@coverly.com" style="color: #92400E; font-weight: 700;">security@coverly.com</a>.
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/auth/login" class="btn">Sign In with New Password</a>
    </div>
  `;

  const text = `Hello ${params.name},\n\nYour COVERLY password was changed on ${time}.\n\nIf you did not make this change, please contact security@coverly.com immediately.\n\nRegards,\nCOVERLY Team`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 6. Email Address Changed Notification
 */
export function renderEmailChangedNotification(params: { name: string; oldEmail: string; newEmail: string; timestamp?: string }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const time = params.timestamp || new Date().toUTCString();
  const subject = "Security Notice: COVERLY Account Email Updated";
  const preheader = "The email address associated with your COVERLY account was updated.";

  const content = `
    <h1 class="title">Email Address Updated</h1>
    <p class="lead">
      Hello ${name},<br />
      The primary email address for your COVERLY business account was updated on <strong>${escapeHtml(time)}</strong>.
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <div style="font-size: 13px; color: #334155;"><strong>Previous Email:</strong> ${escapeHtml(params.oldEmail)}</div>
      <div style="font-size: 13px; color: #334155; margin-top: 4px;"><strong>New Email:</strong> ${escapeHtml(params.newEmail)}</div>
    </div>

    <div class="notice">
      <strong>Important:</strong> If you did not authorize this change, please report it immediately to
      <a href="mailto:security@coverly.com" style="color: #92400E; font-weight: 700;">security@coverly.com</a>.
    </div>
  `;

  const text = `Hello ${params.name},\n\nYour COVERLY email was updated from ${params.oldEmail} to ${params.newEmail} on ${time}.\n\nIf unauthorized, contact security@coverly.com immediately.\n\nRegards,\nCOVERLY Team`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}

/**
 * 7. Security Alert for Unusual Authentication Activity
 */
export function renderSecurityAlert(params: { name: string; alertType: string; ipAddress?: string; userAgent?: string; timestamp?: string }): { subject: string; html: string; text: string } {
  const name = escapeHtml(params.name || "Business Partner");
  const time = params.timestamp || new Date().toUTCString();
  const subject = "Security Alert: Unusual Account Activity Detected — COVERLY";
  const preheader = `A security alert (${params.alertType}) was detected on your COVERLY account.`;

  const content = `
    <h1 class="title" style="color: #DC2626;">Security Alert Detected</h1>
    <p class="lead">
      Hello ${name},<br />
      Our security monitoring system detected unusual authentication activity on your COVERLY account:
    </p>

    <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <div style="font-size: 13px; color: #991B1B;"><strong>Alert Type:</strong> ${escapeHtml(params.alertType)}</div>
      <div style="font-size: 13px; color: #991B1B; margin-top: 4px;"><strong>Timestamp:</strong> ${escapeHtml(time)}</div>
      ${params.ipAddress ? `<div style="font-size: 13px; color: #991B1B; margin-top: 4px;"><strong>IP Address:</strong> ${escapeHtml(params.ipAddress)}</div>` : ""}
      ${params.userAgent ? `<div style="font-size: 13px; color: #991B1B; margin-top: 4px;"><strong>Device/Browser:</strong> ${escapeHtml(params.userAgent)}</div>` : ""}
    </div>

    <p class="lead">
      If this was you (e.g. logging in from a new location, VPN, or device), no action is required.
      If you do not recognize this activity, please reset your password immediately.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/auth/forgot-password" class="btn" style="background-color: #DC2626;">Reset Your Password</a>
    </div>
  `;

  const text = `Hello ${params.name},\n\nUnusual activity (${params.alertType}) was detected on your COVERLY account at ${time}.\nIP: ${params.ipAddress || "Unknown"}\n\nIf this was not you, reset your password immediately: ${BASE_URL}/auth/forgot-password\n\nRegards,\nCOVERLY Team`;

  return { subject, html: baseEmailWrapper(subject, preheader, content), text };
}
