import React from "react";
import {
  Smartphone,
  Mail,
  UserCheck,
  CreditCard,
  Receipt,
  Award,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export interface VerificationBadgeState {
  mobile_verified?: boolean;
  email_verified?: boolean;
  identity_verified?: boolean;
  pan_verified?: boolean;
  gst_verified?: boolean;
  udyam_verified?: boolean;
  business_verified?: boolean;
}

interface VerificationBadgesProps {
  badges: VerificationBadgeState;
  compact?: boolean;
  showUnverified?: boolean;
}

const BADGE_ITEMS: {
  key: keyof VerificationBadgeState;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "mobile_verified", label: "Mobile Verified", icon: Smartphone },
  { key: "email_verified", label: "Email Verified", icon: Mail },
  { key: "identity_verified", label: "Identity Verified", icon: UserCheck },
  { key: "pan_verified", label: "PAN Verified", icon: CreditCard },
  { key: "gst_verified", label: "GST Verified", icon: Receipt },
  { key: "udyam_verified", label: "Udyam Verified", icon: Award },
  { key: "business_verified", label: "Business Verified", icon: Building2 },
];

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  badges,
  compact = false,
  showUnverified = true,
}) => {
  const items = showUnverified ? BADGE_ITEMS : BADGE_ITEMS.filter((b) => Boolean(badges[b.key]));

  if (items.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
        <Clock className="w-3 h-3" />
        Verification Pending
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const verified = Boolean(badges[item.key]);
        return (
          <span
            key={item.key}
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
            } ${
              verified
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-stone-50 text-stone-500 border-stone-200"
            }`}
          >
            <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            <span>{item.label}</span>
            {verified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          </span>
        );
      })}
    </div>
  );
};
