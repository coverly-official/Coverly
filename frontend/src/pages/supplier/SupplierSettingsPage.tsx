import React from "react";
import { Bell, ShieldCheck, KeyRound, UserCog } from "lucide-react";

const settings = [
  { title: "Company preferences", description: "Update profile visibility, pricing policy, and catalog behavior.", icon: UserCog },
  { title: "Security & access", description: "Manage login methods, password and permission policies.", icon: KeyRound },
  { title: "Notifications", description: "Control RFQ, order, and verification alerts.", icon: Bell },
  { title: "Compliance center", description: "Review GST, export, and verification status.", icon: ShieldCheck },
];

export const SupplierSettingsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Supplier Settings</h1>
      <p className="text-xs text-stone-500 mt-1">Manage operational preferences for your trading business.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {settings.map(({ title, description, icon: Icon }) => (
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
