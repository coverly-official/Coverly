import React, { useEffect, useState } from "react";
import { RotateCcw, Plus, Clock, CheckCircle2, FileText, AlertCircle, Calendar } from "lucide-react";
import { RetailerReorderRule, RetailerReorderReminder } from "@/types";

export const RetailerReorderPage: React.FC = () => {
  const [rules, setRules] = useState<RetailerReorderRule[]>([]);
  const [reminders, setReminders] = useState<RetailerReorderReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form
  const [ruleTitle, setRuleTitle] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number | string>(100);
  const [unit, setUnit] = useState("kg");
  const [frequencyDays, setFrequencyDays] = useState<number | string>(15);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [rulesRes, remRes] = await Promise.all([
        fetch("/api/retailer/reorder-rules", { headers }),
        fetch("/api/retailer/reorder-reminders", { headers }),
      ]);

      const [rulesJson, remJson] = await Promise.all([rulesRes.json(), remRes.json()]);

      if (rulesJson.success && rulesJson.data) setRules(rulesJson.data);
      if (remJson.success && remJson.data) setReminders(remJson.data);
    } catch (err) {
      console.error("Load reorder data error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/reorder-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: ruleTitle,
          product_name: productName,
          quantity: Number(quantity),
          unit,
          frequency_days: Number(frequencyDays),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: json.message || "Reorder reminder configured." });
        setShowRuleModal(false);
        setRuleTitle("");
        setProductName("");
        setQuantity(100);
        setFrequencyDays(15);
        loadData();
      } else {
        setStatusMsg({ text: json.error || "Failed to configure rule.", isError: true });
      }
    } catch {
      setStatusMsg({ text: "Error creating reorder rule.", isError: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleReminderAction(reminderId: string, action: "acknowledge" | "dismiss" | "create_rfq") {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/reorder-reminders/${reminderId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: json.message });
        loadData();
      }
    } catch (err) {
      console.error("Reminder action error:", err);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-emerald-700" />
            Reorder & Restock Reminder Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure periodic replenishment schedules for fast-moving goods (e.g. 15-day rice/sugar restock) and generate repeat RFQs.
          </p>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Configure Reorder Rule
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMsg.isError
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Due Restock Alerts Banner */}
      {reminders.some((r) => r.status === "due") && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Replenishment Reminders Due for Restock Review</span>
          </div>
          <p className="text-xs text-amber-800">
            The following items have reached their scheduled restock interval. Note: Reminders notify you to review your inventory and do not automatically place an order.
          </p>

          <div className="space-y-2 pt-1">
            {reminders
              .filter((r) => r.status === "due")
              .map((rem) => (
                <div
                  key={rem.id}
                  className="bg-white p-3 rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      {rem.retailer_reorder_rules?.product_name || "Scheduled Restock"}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Scheduled every {rem.retailer_reorder_rules?.frequency_days || 15} days • Due on {rem.reminder_date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReminderAction(rem.id, "create_rfq")}
                      className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Create Restock RFQ
                    </button>
                    <button
                      onClick={() => handleReminderAction(rem.id, "acknowledge")}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleReminderAction(rem.id, "dismiss")}
                      className="px-2 py-1 text-stone-400 hover:text-stone-700 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reorder Rules List */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-stone-900">Configured Reorder Rules ({rules.length})</h2>

        {loading ? (
          <div className="text-center py-10 text-stone-500 text-xs">Loading schedules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-10 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
            <Clock className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-stone-700">No reorder rules configured yet.</p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Set up reminders for recurring bulk purchases like rice, edible oil, or flour.
            </p>
            <button
              onClick={() => setShowRuleModal(true)}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium"
            >
              Configure Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {rules.map((rule) => (
              <div key={rule.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">{rule.title}</h3>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Product: <span className="font-semibold text-stone-800">{rule.product_name}</span> ({rule.quantity} {rule.unit})
                  </p>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Every {rule.frequency_days} days</span>
                    <span>•</span>
                    <span>Next reminder: {rule.next_reminder_date}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active Schedule
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configure Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Configure Reorder Rule</h2>
              <button onClick={() => setShowRuleModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="e.g. Rice & Sugar 15-Day Restock"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Basmati Rice 1121 & Refined Sugar"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Target Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="tin">tin</option>
                    <option value="litre">litre</option>
                    <option value="carton">carton</option>
                    <option value="piece">pc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reminder Frequency (Days) *
                </label>
                <select
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value={7}>Every 7 Days (Weekly)</option>
                  <option value={15}>Every 15 Days (Bi-Weekly)</option>
                  <option value={30}>Every 30 Days (Monthly)</option>
                  <option value={60}>Every 60 Days (Bi-Monthly)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
