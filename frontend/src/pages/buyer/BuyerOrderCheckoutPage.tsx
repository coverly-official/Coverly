import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

type PaymentMethodCode = "upi" | "card" | "netbanking" | "wallet";

const METHOD_META: Record<PaymentMethodCode, { label: string; desc: string; icon: React.ElementType }> = {
  upi: { label: "UPI", desc: "Instant B2B UPI & QR apps", icon: Smartphone },
  card: { label: "Cards", desc: "Corporate / Debit / Credit Cards", icon: CreditCard },
  netbanking: { label: "Net Banking", desc: "All major Indian banks", icon: Landmark },
  wallet: { label: "Wallets", desc: "Supported digital wallets", icon: Wallet },
};

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem("coverly_user_id") || "";
  const token = localStorage.getItem("auth_token") || "";
  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load checkout SDK: ${src}`));
    document.head.appendChild(script);
  });
}

export const BuyerOrderCheckoutPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnPaymentRef = searchParams.get("payment_ref");

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "pending" | "error";
    text: string;
  } | null>(null);

  const loadSummary = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/payments/orders/${orderId}/summary`, {
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Unable to load order checkout details.");
      } else {
        setSummary(body.data);
        const methods: PaymentMethodCode[] = body.data?.gateway?.active_gateway?.supported_methods || [];
        if (methods.length > 0 && !selectedMethod) {
          setSelectedMethod(methods[0]);
        }
      }
    } catch {
      setError("Network error loading order checkout summary.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const verifyPaymentServerSide = useCallback(
    async (
      paymentId: string,
      extra?: { provider_order_id?: string; provider_payment_id?: string; provider_signature?: string }
    ) => {
      setVerifying(true);
      try {
        const res = await fetch(`${API_BASE}/payments/${paymentId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(extra || {}),
        });
        const body = await res.json();
        if (res.ok && body.success && body.data?.verified) {
          setStatusBanner({
            type: "success",
            text: "Payment confirmed by provider API. Your order has been updated to Deposit Paid.",
          });
        } else {
          const st = body.data?.payment?.status || "PENDING";
          setStatusBanner({
            type: st === "FAILED" ? "error" : "pending",
            text:
              body.data?.provider_message ||
              body.error ||
              `Current verified provider status: ${st}. Redirect alone does not confirm payment until verified by the gateway.`,
          });
        }
        await loadSummary();
      } catch {
        setStatusBanner({
          type: "pending",
          text: "Could not complete instant verification. Your payment will reconcile automatically via verified webhook.",
        });
      } finally {
        setVerifying(false);
      }
    },
    [loadSummary]
  );

  // If returning from hosted checkout (Cashfree/PayU/Paytm), trigger authoritative server verification
  useEffect(() => {
    if (!returnPaymentRef || !summary?.existing_payments?.length) return;
    const match = summary.existing_payments.find((p: any) => p.payment_reference === returnPaymentRef);
    if (match && !["SUCCESS", "FAILED", "REFUNDED"].includes(match.status)) {
      verifyPaymentServerSide(match.id);
    }
  }, [returnPaymentRef, summary?.existing_payments, verifyPaymentServerSide]);

  const handleProceedToPay = async () => {
    if (!orderId || !selectedMethod) return;
    setInitiating(true);
    setStatusBanner(null);

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `chk_${orderId}_${crypto.randomUUID()}`
          : `chk_${orderId}_${Date.now()}`;

      const res = await fetch(`${API_BASE}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: selectedMethod,
          idempotency_key: idempotencyKey,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setStatusBanner({
          type: "error",
          text: body.error || "Unable to initiate payment checkout with active gateway.",
        });
        return;
      }

      const payment = body.data.payment;
      const payload = body.data.checkout_payload || {};

      // Launch official provider-hosted checkout (zero card/UPI PIN collection on COVERLY!)
      if (payload.provider === "razorpay" && payload.razorpay_order_id) {
        await loadExternalScript(payload.sdk_url);
        const RazorpayCtor = (window as any).Razorpay;
        if (!RazorpayCtor) throw new Error("Razorpay Checkout SDK unavailable.");
        const rzp = new RazorpayCtor({
          key: payload.key_id,
          amount: payload.amount_paise,
          currency: payload.currency,
          name: payload.name,
          description: payload.description,
          order_id: payload.razorpay_order_id,
          prefill: payload.prefill,
          handler: (response: any) => {
            verifyPaymentServerSide(payment.id, {
              provider_order_id: response.razorpay_order_id,
              provider_payment_id: response.razorpay_payment_id,
              provider_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setStatusBanner({
                type: "pending",
                text: "Checkout window closed before completion. You can safely retry payment below without creating duplicate orders.",
              });
            },
          },
        });
        rzp.open();
      } else if (payload.provider === "cashfree" && payload.payment_session_id) {
        await loadExternalScript(payload.sdk_url);
        const cfFactory = (window as any).Cashfree;
        if (!cfFactory) throw new Error("Cashfree JS SDK unavailable.");
        const cf = cfFactory({ mode: payload.environment === "production" ? "production" : "sandbox" });
        await cf.checkout({
          paymentSessionId: payload.payment_session_id,
          redirectTarget: "_self",
        });
      } else if (payload.provider === "payu" && payload.action_url && payload.form_fields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payload.action_url;
        Object.entries(payload.form_fields).forEach(([k, v]) => {
          const inp = document.createElement("input");
          inp.type = "hidden";
          inp.name = k;
          inp.value = String(v);
          form.appendChild(inp);
        });
        document.body.appendChild(form);
        form.submit();
      } else if (payload.provider === "paytm" && payload.txnToken) {
        await loadExternalScript(payload.sdk_url);
        const checkoutJs = (window as any).Paytm?.CheckoutJS;
        if (!checkoutJs) throw new Error("Paytm CheckoutJS SDK unavailable.");
        await checkoutJs.init({
          root: "",
          flow: "DEFAULT",
          data: {
            orderId: payload.orderId,
            token: payload.txnToken,
            tokenType: "TXN_TOKEN",
            amount: payload.amount,
          },
          handler: {
            notifyMerchant: (eventName: string) => {
              if (eventName === "APP_CLOSED") {
                verifyPaymentServerSide(payment.id);
              }
            },
          },
        });
        checkoutJs.invoke();
      } else {
        setStatusBanner({
          type: "pending",
          text: `Payment record ${payment.payment_reference} created. Awaiting gateway checkout response.`,
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Failed to launch payment gateway checkout.",
      });
    } finally {
      setInitiating(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <div className="h-24 rounded-2xl bg-stone-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="text-sm font-semibold text-stone-900">{error || "Order checkout unavailable."}</p>
        <Link to="/buyer/orders" className="text-xs font-semibold text-emerald-800 underline">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const order = summary.order;
  const gw = summary.gateway?.active_gateway;
  const supportedMethods: PaymentMethodCode[] = gw?.supported_methods || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Link
          to={`/buyer/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Order {order.order_number}
        </Link>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
          <Lock className="w-3.5 h-3.5" />
          Provider-Hosted PCI-Compliant Checkout
        </span>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : statusBanner.type === "pending"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusBanner.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : statusBanner.type === "pending" ? (
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Order Cost Breakdown */}
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-6 space-y-4 shadow-xs">
          <div>
            <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              {order.order_number}
            </span>
            <h1 className="text-lg font-bold text-stone-900 mt-1.5">Order Payment Summary</h1>
            <p className="text-xs text-stone-500">
              Supplier: <strong className="text-stone-800">{order.supplier_name}</strong>
              {order.supplier_city ? ` • ${order.supplier_city}` : ""}
            </p>
          </div>

          {/* Line Items */}
          {(order.items || []).length > 0 && (
            <div className="border-t border-b border-stone-100 py-3 space-y-2 text-xs">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-stone-900">{item.item_name}</div>
                    <div className="text-[11px] text-stone-500">
                      Qty: {item.quantity} {item.unit || "units"}
                    </div>
                  </div>
                  <div className="font-semibold text-stone-900 tabular-nums">
                    ₹{Number(item.total_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decimal-Safe Cost Breakdown */}
          <div className="space-y-2 text-xs text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{Number(order.subtotal_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST)</span>
              <span className="tabular-nums">₹{Number(order.tax_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Freight &amp; Logistics</span>
              <span className="tabular-nums">₹{Number(order.freight_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Charges</span>
              <span className="tabular-nums">₹{Number(order.other_charges_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-stone-900">
              <span>Total Payable ({order.currency})</span>
              <span className="text-lg text-emerald-800 tabular-nums">
                ₹{Number(order.total_amount_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method Selection & Pay CTA */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900">Select Payment Method</h2>

          {summary.already_paid ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Order Paid &amp; Verified
              </div>
              <p className="text-[11px]">
                Payment has already been verified for this order. Duplicate payments are blocked.
              </p>
            </div>
          ) : !gw ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Online Payment Gateway Unavailable
              </div>
              <p className="text-[11px]">
                {summary.gateway?.message ||
                  "No payment gateway is currently enabled and configured. Please try again later."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-stone-50 border border-stone-200">
                <span className="text-stone-500">Active Gateway:</span>
                <span className="font-bold text-stone-900">
                  {gw.display_name}{" "}
                  {gw.mode === "sandbox" && (
                    <span className="text-amber-700 font-semibold">(Sandbox)</span>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {supportedMethods.map((method) => {
                  const meta = METHOD_META[method];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const active = selectedMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        active
                          ? "border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-emerald-700" : "text-stone-500"}`} />
                      <div>
                        <div className="text-xs font-bold text-stone-900">{meta.label}</div>
                        <div className="text-[10px] text-stone-500">{meta.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={initiating || verifying || !selectedMethod}
                onClick={handleProceedToPay}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-45 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {initiating
                  ? "Initializing Secure Checkout..."
                  : verifying
                  ? "Verifying with Provider..."
                  : `Pay ₹${Number(order.total_amount_decimal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </button>

              <p className="text-[10px] text-stone-500 leading-relaxed">
                COVERLY never collects or stores card numbers, CVV, or UPI PINs. Payment is confirmed strictly via verified gateway API or authenticated webhook.
              </p>
            </>
          )}

          {/* Previous Attempts & Re-verify Option */}
          {(summary.existing_payments || []).length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="text-[11px] font-bold text-stone-700">Payment Attempts</div>
              {summary.existing_payments.map((p: any) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <div className="font-mono font-semibold text-stone-800">{p.payment_reference}</div>
                    <div className="text-stone-500 uppercase">
                      {p.provider} &middot; {p.status}
                    </div>
                  </div>
                  {["PENDING", "PROCESSING", "CREATED"].includes(p.status) && (
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => verifyPaymentServerSide(p.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Verify
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
