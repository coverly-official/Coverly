import React, { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings2,
  PlugZap,
  Power,
  Lock,
  Copy,
  Check,
  X,
  Info,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface GatewayConfig {
  provider: "cashfree" | "razorpay" | "payu" | "paytm";
  display_name: string;
  api_version: string;
  mode: "sandbox" | "production";
  is_enabled: boolean;
  is_active_primary: boolean;
  credentials_configured: boolean;
  configured_env_vars: string[];
  missing_env_vars: string[];
  environment_from_env: "sandbox" | "production";
  environment_mismatch_error: string | null;
  webhook_secret_configured: boolean;
  webhook_url: string;
  supported_methods: ("upi" | "card" | "netbanking" | "wallet")[];
  split_settlement_supported: boolean;
  split_settlement_approved: boolean;
  split_settlement_product: string;
  last_connection_status: "not_tested" | "connected" | "failed" | "missing_credentials";
  last_connection_message: string | null;
  last_verified_at: string | null;
}

const ALL_METHODS: { id: "upi" | "card" | "netbanking" | "wallet"; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Cards" },
  { id: "netbanking", label: "Net Banking" },
  { id: "wallet", label: "Wallets" },
];

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem("coverly_user_id") || "";
  const token = localStorage.getItem("auth_token") || "";
  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const AdminPaymentGatewaysPage: React.FC = () => {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Configure modal
  const [configTarget, setConfigTarget] = useState<GatewayConfig | null>(null);
  const [modalMode, setModalMode] = useState<"sandbox" | "production">("sandbox");
  const [modalMethods, setModalMethods] = useState<("upi" | "card" | "netbanking" | "wallet")[]>([]);

  const loadGateways = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/payments/admin/gateways`, {
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Unable to load payment gateway configurations.");
      } else {
        setGateways(body.data.gateways || []);
      }
    } catch {
      setError("Network error loading payment gateway settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/payments/admin/gateways/${provider}/test`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Connection test failed." });
      } else {
        const connected = Boolean(body.data?.connected);
        setFeedback({
          type: connected ? "success" : "error",
          text: body.data?.message || body.message || "Connection check completed.",
        });
        await loadGateways();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error during gateway connection test." });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleUpdateGateway = async (
    provider: string,
    payload: {
      mode?: "sandbox" | "production";
      is_enabled?: boolean;
      is_active_primary?: boolean;
      supported_methods?: ("upi" | "card" | "netbanking" | "wallet")[];
    }
  ) => {
    setUpdatingProvider(provider);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/payments/admin/gateways/${provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Unable to update gateway setting." });
      } else {
        setFeedback({ type: "success", text: body.message || "Gateway configuration saved." });
        setConfigTarget(null);
        await loadGateways();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error updating gateway configuration." });
    } finally {
      setUpdatingProvider(null);
    }
  };

  const copyWebhook = (url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const openConfigureModal = (gw: GatewayConfig) => {
    setConfigTarget(gw);
    setModalMode(gw.mode);
    setModalMethods(gw.supported_methods || ["upi", "card", "netbanking", "wallet"]);
  };

  const toggleMethod = (m: "upi" | "card" | "netbanking" | "wallet") => {
    setModalMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            Payment Gateway Configuration
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage Cashfree Payments, Razorpay, PayU, and Paytm for Business. All providers stay disabled until server environment credentials are configured and verified.
          </p>
        </div>
        <button
          type="button"
          onClick={loadGateways}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Security Notice */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3 text-xs text-emerald-950">
        <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Zero-Secret Browser Security Policy</p>
          <p className="text-[11px] text-emerald-900">
            API secrets, salts, and merchant keys are read exclusively from backend server environment variables (Vercel Project Settings / Secrets Manager). They are never accepted through browser forms, never exposed to frontend bundles, and never displayed after saving. Only Super Admin and Finance Admin roles may modify gateway status.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-[11px] underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Provider Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {gateways.map((gw) => {
            const isConnected = gw.last_connection_status === "connected";
            const isTesting = testingProvider === gw.provider;
            const isUpdating = updatingProvider === gw.provider;

            return (
              <div
                key={gw.provider}
                className={`rounded-2xl border bg-white p-5 shadow-xs space-y-4 transition ${
                  gw.is_active_primary
                    ? "border-emerald-400 ring-1 ring-emerald-100"
                    : "border-stone-200"
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-stone-900">{gw.display_name}</h2>
                      {gw.is_active_primary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-700 text-white">
                          Active Primary
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          gw.mode === "production"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {gw.mode === "production" ? "Production Mode" : "Test / Sandbox Mode"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{gw.api_version}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                      gw.is_enabled
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-stone-100 text-stone-600 border-stone-200"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {gw.is_enabled ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      Credentials Status
                    </span>
                    <div className="mt-0.5 font-semibold flex items-center gap-1">
                      {gw.credentials_configured ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-800">Configured (Env)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-amber-800">Missing Credentials</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      Connection Status
                    </span>
                    <div className="mt-0.5 font-semibold flex items-center gap-1">
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-800">Verified Connected</span>
                        </>
                      ) : gw.last_connection_status === "failed" ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-red-700">Failed</span>
                        </>
                      ) : (
                        <span className="text-stone-600 capitalize">
                          {gw.last_connection_status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      Last Successful Verification
                    </span>
                    <p className="text-[11px] text-stone-700 mt-0.5">
                      {gw.last_verified_at ? new Date(gw.last_verified_at).toLocaleString() : "Never verified"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      Split Settlement
                    </span>
                    <p className="text-[11px] text-stone-700 mt-0.5">
                      {gw.split_settlement_approved ? "Approved" : "Pending Provider Approval"}
                    </p>
                  </div>
                </div>

                {/* Missing Env Vars / Connection Message */}
                {gw.missing_env_vars.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                    <strong>Missing Server Env Vars:</strong>{" "}
                    <code className="font-mono">{gw.missing_env_vars.join(", ")}</code>
                  </div>
                )}

                {gw.environment_mismatch_error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800">
                    {gw.environment_mismatch_error}
                  </div>
                )}

                {gw.last_connection_message && (
                  <p className="text-[11px] text-stone-600 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{gw.last_connection_message}</span>
                  </p>
                )}

                {/* Webhook Endpoint Copy */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px]">
                  <span className="text-stone-500 shrink-0">Webhook URL:</span>
                  <code className="font-mono text-stone-800 truncate flex-1">{gw.webhook_url}</code>
                  <button
                    type="button"
                    onClick={() => copyWebhook(gw.webhook_url)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer shrink-0"
                  >
                    {copiedUrl === gw.webhook_url ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => openConfigureModal(gw)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Configure
                  </button>

                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={() => handleTestConnection(gw.provider)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <PlugZap className="w-3.5 h-3.5" />
                    {isTesting ? "Testing..." : "Test Connection"}
                  </button>

                  {gw.is_enabled ? (
                    <>
                      {!gw.is_active_primary && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateGateway(gw.provider, { is_active_primary: true })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Set Active Primary
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleUpdateGateway(gw.provider, { is_enabled: false, is_active_primary: false })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Disable
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdating || !gw.credentials_configured || !isConnected}
                      title={
                        !gw.credentials_configured
                          ? "Configure server environment variables first"
                          : !isConnected
                          ? "Run Test Connection successfully before enabling"
                          : "Enable this payment gateway"
                      }
                      onClick={() =>
                        handleUpdateGateway(gw.provider, { is_enabled: true, is_active_primary: true })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
                    >
                      Enable &amp; Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configure Modal */}
      {configTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Configure {configTarget.display_name}</h3>
                <p className="text-[11px] text-stone-300">{configTarget.api_version}</p>
              </div>
              <button
                type="button"
                onClick={() => setConfigTarget(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1.5">Environment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["sandbox", "production"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModalMode(m)}
                      className={`px-3 py-2.5 rounded-lg border font-semibold text-left cursor-pointer transition ${
                        modalMode === m
                          ? m === "production"
                            ? "border-red-600 bg-red-50 text-red-900"
                            : "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <div>{m === "sandbox" ? "Sandbox / Test Mode" : "Production Mode"}</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        {m === "sandbox"
                          ? "Safe test credentials, zero real money"
                          : "Requires approved merchant & live env keys"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1.5">
                  Enabled Checkout Payment Methods
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50"
                    >
                      <input
                        type="checkbox"
                        checked={modalMethods.includes(m.id)}
                        onChange={() => toggleMethod(m.id)}
                        className="h-4 w-4 rounded border-stone-300 text-emerald-700"
                      />
                      <span className="font-medium text-stone-800">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <p className="font-semibold text-stone-900">Server Environment Setup Checklist</p>
                <p className="text-[11px] text-stone-600">
                  Set these secrets in Vercel Environment Variables (never in frontend code):
                </p>
                <ul className="list-disc pl-4 text-[11px] font-mono text-stone-700 space-y-0.5">
                  {[...configTarget.configured_env_vars, ...configTarget.missing_env_vars].map((v) => (
                    <li key={v}>
                      {v}{" "}
                      <span
                        className={
                          configTarget.configured_env_vars.includes(v)
                            ? "text-emerald-700 font-sans font-semibold"
                            : "text-amber-700 font-sans font-semibold"
                        }
                      >
                        ({configTarget.configured_env_vars.includes(v) ? "configured" : "missing"})
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-stone-500 pt-1">
                  Split settlement product: <strong>{configTarget.split_settlement_product}</strong>.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfigTarget(null)}
                className="px-4 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingProvider === configTarget.provider || modalMethods.length === 0}
                onClick={() =>
                  handleUpdateGateway(configTarget.provider, {
                    mode: modalMode,
                    supported_methods: modalMethods,
                  })
                }
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
