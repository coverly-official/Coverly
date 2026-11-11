"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Factory,
  ShoppingBag,
  Store,
} from "lucide-react";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/data/contact";
import { ROLE_OPTIONS, signIn, signUp, type AccountRole } from "@/lib/auth";

type Mode = "login" | "signup";
type FieldName =
  | "identifier"
  | "name"
  | "business"
  | "email"
  | "phone"
  | "password";
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "not-configured" | "failed";

const ROLE_ICONS = {
  buyer: ShoppingBag,
  wholesaler: Store,
  manufacturer: Factory,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s-]{10,14}$/;

const inputClass =
  "w-full h-12 rounded-xl bg-white/10 border border-white/15 px-4 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-coral focus:ring-1 focus:ring-coral aria-[invalid=true]:border-red-300";

interface FieldProps {
  id: FieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-white/80"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

function tabClass(active: boolean): string {
  return `-mb-px border-b-2 pb-3 transition ${
    active
      ? "border-coral text-white"
      : "border-transparent text-white/60 hover:text-white"
  }`;
}

interface AuthScreenProps {
  mode: Mode;
  initialRole: AccountRole;
}

export function AuthScreen({ mode, initialRole }: AuthScreenProps) {
  const router = useRouter();
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [values, setValues] = useState<Record<FieldName, string>>({
    identifier: "",
    name: "",
    business: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const isSignup = mode === "signup";
  const activeRole =
    ROLE_OPTIONS.find((option) => option.id === role) ?? ROLE_OPTIONS[0];
  const needsBusiness = role !== "buyer";

  function setValue(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): Errors {
    const found: Errors = {};
    if (isSignup) {
      if (!values.name.trim()) found.name = "Enter your name.";
      if (needsBusiness && !values.business.trim()) {
        found.business = "Enter your business name.";
      }
      if (!EMAIL_PATTERN.test(values.email.trim())) {
        found.email = "Enter a valid email address.";
      }
      if (!PHONE_PATTERN.test(values.phone.trim())) {
        found.phone = "Enter a valid phone number.";
      }
      if (values.password.length < 8) {
        found.password = "Use at least 8 characters.";
      }
    } else {
      const id = values.identifier.trim();
      if (!EMAIL_PATTERN.test(id) && !PHONE_PATTERN.test(id)) {
        found.identifier = "Enter your email or phone number.";
      }
      if (!values.password) found.password = "Enter your password.";
    }
    return found;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setStatus("idle");
    const result = isSignup
      ? await signUp({
          role,
          name: values.name.trim(),
          business: values.business.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
        })
      : await signIn({
          role,
          identifier: values.identifier.trim(),
          password: values.password,
        });
    setBusy(false);

    if (result.ok) {
      router.push("/");
      return;
    }
    setStatus(result.reason === "not-configured" ? "not-configured" : "failed");
  }

  function buildEarlyAccessMessage(): string {
    const lines = [
      `Hi Coverly team, I would like early access to a ${activeRole.label.toLowerCase()} account.`,
    ];
    if (values.name.trim()) lines.push(`Name: ${values.name.trim()}`);
    if (values.business.trim()) lines.push(`Business: ${values.business.trim()}`);
    if (isSignup) {
      if (values.email.trim()) lines.push(`Email: ${values.email.trim()}`);
      if (values.phone.trim()) lines.push(`Phone: ${values.phone.trim()}`);
    } else if (values.identifier.trim()) {
      lines.push(`Contact: ${values.identifier.trim()}`);
    }
    return lines.join("\n");
  }

  const whatsappNumber: string = WHATSAPP_NUMBER;
  const contactEmail: string = CONTACT_EMAIL;
  const message = buildEarlyAccessMessage();
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const mailHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Early access request")}&body=${encodeURIComponent(message)}`;

  return (
    <main className="px-4 sm:px-6 py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] shadow-card md:grid-cols-2">
        <section className="bg-navy p-6 text-white sm:p-10">
          <nav aria-label="Account" className="mb-8 flex gap-6 border-b border-white/10 text-sm font-semibold">
            <Link
              href="/login"
              aria-current={!isSignup ? "page" : undefined}
              className={tabClass(!isSignup)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              aria-current={isSignup ? "page" : undefined}
              className={tabClass(isSignup)}
            >
              Sign up
            </Link>
          </nav>

          <h1 className="mb-1 font-heading text-3xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mb-6 text-sm text-white/70">
            {isSignup
              ? "Choose how you will use Coverly."
              : "Log in to continue."}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-white/80">
                {isSignup ? "I am signing up as" : "I am logging in as"}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = ROLE_ICONS[option.id];
                  return (
                    <label key={option.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={option.id}
                        checked={role === option.id}
                        onChange={() => setRole(option.id)}
                        className="peer sr-only"
                      />
                      <span className="flex flex-col items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 peer-checked:border-coral peer-checked:bg-white/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-coral">
                        <Icon size={18} aria-hidden="true" />
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {isSignup ? (
              <>
                <Field
                  id="name"
                  label="Full name"
                  value={values.name}
                  onChange={(v) => setValue("name", v)}
                  error={errors.name}
                  autoComplete="name"
                />
                {needsBusiness && (
                  <Field
                    id="business"
                    label="Business name"
                    value={values.business}
                    onChange={(v) => setValue("business", v)}
                    error={errors.business}
                    autoComplete="organization"
                  />
                )}
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={(v) => setValue("email", v)}
                  error={errors.email}
                  autoComplete="email"
                />
                <Field
                  id="phone"
                  label="Phone number"
                  type="tel"
                  value={values.phone}
                  onChange={(v) => setValue("phone", v)}
                  error={errors.phone}
                  autoComplete="tel"
                />
              </>
            ) : (
              <Field
                id="identifier"
                label="Email or phone number"
                value={values.identifier}
                onChange={(v) => setValue("identifier", v)}
                error={errors.identifier}
                autoComplete="username"
              />
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setValue("password", e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-200">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-coral text-sm font-semibold text-navy shadow-[0_8px_30px_rgba(249,177,122,0.35)] transition hover:brightness-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {busy ? "Please wait" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <div aria-live="polite">
            {status !== "idle" && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm"
              >
                <p className="mb-1 font-semibold text-coral">
                  {status === "not-configured"
                    ? "Accounts are not open yet"
                    : "Something went wrong"}
                </p>
                <p className="mb-3 text-white/80">
                  {status === "not-configured"
                    ? "Nothing you typed has been saved. Request early access and the Coverly team will get in touch."
                    : "Please try again, or request early access and the Coverly team will get in touch."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full bg-coral px-4 py-2 text-xs font-semibold text-navy hover:brightness-95"
                  >
                    Request early access on WhatsApp
                  </a>
                  {contactEmail && (
                    <a
                      href={mailHref}
                      className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Email us instead
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-white/50">
            <span className="h-px flex-1 bg-white/15" />
            or
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <Link
            href="/browse"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Browse as guest
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <p className="mt-6 text-center text-xs text-white/60">
            {isSignup ? "Already have an account? " : "New to Coverly? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-coral hover:underline"
            >
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </p>
        </section>

        <aside className="bg-surface-muted p-6 text-ink sm:p-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
            Planned for {activeRole.label.toLowerCase()} accounts
          </p>
          <h2 className="mb-2 font-heading text-2xl font-bold tracking-tight">
            {activeRole.title}
          </h2>
          <p className="mb-6 text-ink-secondary">{activeRole.blurb}</p>
          <ul className="space-y-3">
            {activeRole.perks.map((perk) => (
              <li key={perk} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <Check size={12} aria-hidden="true" />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-ink-secondary">
            Account features are still in development. Guests can already
            browse sample listings.
          </p>
        </aside>
      </div>
    </main>
  );
}