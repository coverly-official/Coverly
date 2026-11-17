import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WORKSPACE_REGISTRY, getWorkspaceItem, isAdminRole, WorkspaceItem } from "@/lib/role-routing";
import type { UserRole } from "@/types";
import {
  ChevronDown,
  Building2,
  Store,
  Factory,
  Briefcase,
  Globe,
  Truck,
  Layers,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";

const getCategoryIcon = (category: WorkspaceItem["category"]) => {
  switch (category) {
    case "buyer":
      return <Store className="w-4 h-4 text-emerald-600" />;
    case "supplier":
      return <Factory className="w-4 h-4 text-blue-600" />;
    case "service":
      return <Briefcase className="w-4 h-4 text-purple-600" />;
    case "trade":
      return <Globe className="w-4 h-4 text-amber-600" />;
    case "logistics":
      return <Truck className="w-4 h-4 text-indigo-600" />;
    case "internal":
      return <ShieldCheck className="w-4 h-4 text-rose-600" />;
    default:
      return <Layers className="w-4 h-4 text-stone-600" />;
  }
};

export const WorkspaceSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, business, activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const currentWorkspace = getWorkspaceItem(activeRole);
  const userRoles = (user.roles && user.roles.length > 0) ? user.roles : [activeRole || "buyer"];
  const isAdmin = isAdminRole(activeRole) || userRoles.some((r) => isAdminRole(r));

  // Admin operates inside the dedicated Admin Control Center — never show a Buyer/Supplier Workspace dropdown
  if (isAdmin) return null;

  // Available workspaces strictly scoped to user's assigned non-admin roles
  const availableWorkspaces: WorkspaceItem[] = Object.values(WORKSPACE_REGISTRY).filter((ws) => {
    if (isAdminRole(ws.role)) return false;
    if (userRoles.includes(ws.role)) return true;
    if (ws.role === "buyer") return true;
    return false;
  });

  const handleSelectWorkspace = (item: WorkspaceItem) => {
    setActiveRole(item.role);
    setIsOpen(false);
    navigate(item.route);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition px-2.5 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
          compact ? "px-2 py-1 text-[11px]" : ""
        }`}
        title="Switch active workspace"
      >
        <div className="p-1 rounded-md bg-stone-100 shrink-0">
          {getCategoryIcon(currentWorkspace.category)}
        </div>
        <div className="text-left hidden sm:block max-w-[140px] truncate">
          <p className="truncate font-semibold text-stone-900 leading-tight">
            {currentWorkspace.label}
          </p>
          {business?.name && (
            <p className="text-[10px] text-stone-500 truncate leading-tight mt-0.5">
              {business.name}
            </p>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Info */}
          <div className="px-3.5 py-2 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Connected Workspace
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <Sparkles className="w-2.5 h-2.5" />
                  Admin All-Access
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-stone-900 mt-1 truncate">
              {business?.name || user.full_name}
            </p>
            <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
          </div>

          {/* Workspaces List */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-stone-50">
            {availableWorkspaces.map((item) => {
              const isSelected = item.role === activeRole;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleSelectWorkspace(item)}
                  className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 transition hover:bg-stone-50 ${
                    isSelected ? "bg-blue-50/70" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1 rounded-md bg-stone-100">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium truncate ${
                          isSelected ? "text-blue-900 font-bold" : "text-stone-800"
                        }`}
                      >
                        {item.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Platform Switcher for cross-marketplace navigation */}
          <div className="px-3.5 pt-2 mt-1 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Marketplace Directory</span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/directories");
              }}
              className="text-blue-700 hover:text-blue-900 font-semibold"
            >
              Browse All &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
