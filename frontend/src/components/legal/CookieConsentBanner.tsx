import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, SlidersHorizontal, X, Check } from "lucide-react";

const STORAGE_KEY = "coverly_cookie_consent_v1";

interface CookieConsentState {
  version: string;
  essential: true;
  preferences: boolean;
  analytics: boolean;
  updatedAt: string;
}

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Optional toggles strictly default to false (never preselected)
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setShowBanner(true);
      } else {
        const parsed = JSON.parse(raw) as CookieConsentState;
        setPreferences(Boolean(parsed.preferences));
        setAnalytics(Boolean(parsed.analytics));
      }
    } catch {
      setShowBanner(true);
    }

    const handleOpenSettings = () => {
      setShowModal(true);
      setShowBanner(false);
    };
    window.addEventListener("coverly:open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("coverly:open-cookie-settings", handleOpenSettings);
  }, []);

  const persistConsent = (nextPrefs: boolean, nextAnalytics: boolean) => {
    const payload: CookieConsentState = {
      version: "2026-11-18-v1",
      essential: true,
      preferences: nextPrefs,
      analytics: nextAnalytics,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
    setPreferences(nextPrefs);
    setAnalytics(nextAnalytics);
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && !showModal && (
        <aside
          role="dialog"
          aria-label="Cookie and privacy consent"
          className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto bg-stone-950 text-stone-100 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-white">Your Privacy & Cookie Choices</p>
                <p className="text-stone-300 mt-0.5">
                  COVERLY uses essential browser storage for secure login sessions and role
                  routing. Optional preference and analytics storage remain off unless you opt in.
                  Read our{" "}
                  <Link to="/cookie-policy" className="text-amber-300 underline hover:text-amber-200">
                    Cookie Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-amber-300 underline hover:text-amber-200">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-700 hover:bg-stone-800 text-stone-200 text-xs font-semibold transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Customize
              </button>
              <button
                type="button"
                onClick={() => persistConsent(false, false)}
                className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => persistConsent(true, true)}
                className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden text-stone-900">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 id="cookie-modal-title" className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Cookie className="w-4 h-4 text-amber-600" />
                Cookie & Storage Preferences
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                aria-label="Close Cookie Preferences"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-stone-900">Essential Session Storage</div>
                  <p className="text-stone-600 mt-0.5">
                    Required for sign-in sessions, workspace security and storing your consent status.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] shrink-0">
                  Always Active
                </span>
              </div>

              <label className="p-3.5 rounded-xl border border-stone-200 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50">
                <div>
                  <div className="font-bold text-stone-900">Preference Storage (Optional)</div>
                  <p className="text-stone-600 mt-0.5">
                    Remembers optional sourcing filters and display settings across visits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-900 focus:ring-blue-900"
                />
              </label>

              <label className="p-3.5 rounded-xl border border-stone-200 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50">
                <div>
                  <div className="font-bold text-stone-900">Usage Analytics (Optional)</div>
                  <p className="text-stone-600 mt-0.5">
                    Helps improve marketplace search relevance. Disabled unless explicitly opted in.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-900 focus:ring-blue-900"
                />
              </label>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => persistConsent(false, false)}
                className="px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={() => persistConsent(preferences, analytics)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
