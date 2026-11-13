import React from "react";
import { Bell, ShieldCheck, KeyRound, UserCog } from "lucide-react";

const sections = [
  { title: "Account preferences", description: "Update profiles, notifications and workspace defaults.", icon: UserCog },
  { title: "Password & security", description: "Set password policies, MFA, and active login methods.", icon: KeyRound },
  { title: "Alerts & notifications", description: "Choose RFQ, quotation, and shipment updates.", icon: Bell },
  { title: "Compliance center", description: "Review buyer verification and supplier approval settings.", icon: ShieldCheck },
];

export const BuyerSettingsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Account Settings</h1>
      <p className="text-xs text-stone-500 mt-1">Manage your account preferences, approvals, and sourcing alerts.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {sections.map(({ title, description, icon: Icon }) => (
        <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">{title}</h3>
          <p className="mt-2 text-sm text-stone-600">{description}</p>
        </div>
      ))}
    </div>
  </div>
);
