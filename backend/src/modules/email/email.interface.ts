export type AuthEmailTemplateType =
  | "welcome_email"
  | "email_verification_otp"
  | "google_verification_otp"
  | "forgot_password_otp"
  | "password_changed"
  | "email_changed"
  | "security_alert";

export type EmailDeliveryProvider = "insforge_emails" | "smtp" | "dev_mock";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailPayload {
  to: string | EmailRecipient | (string | EmailRecipient)[];
  subject: string;
  html: string;
  text?: string;
  templateType: AuthEmailTemplateType;
  userId?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: EmailDeliveryProvider;
  messageId?: string;
  error?: string;
  timestamp: string;
}
