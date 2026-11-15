import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile, Business, UserRole } from "@/types";
import { insforge } from "@/lib/insforge";

interface AuthContextType {
  user: UserProfile | null;
  business: Business | null;
  isLoading: boolean;
  activeRole: UserRole;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage for instant, zero-flicker session restore
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("coverly_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [business, setBusiness] = useState<Business | null>(() => {
    try {
      const stored = localStorage.getItem("coverly_business_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const hasStoredProfile = Boolean(localStorage.getItem("coverly_user_profile"));
    const hasStoredId = Boolean(localStorage.getItem("coverly_user_id"));
    // Only show loading on initial mount if there is an ID to verify but no profile cached
    return !hasStoredProfile && hasStoredId;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem("coverly_active_role") as UserRole;
    if (savedRole && savedRole !== "guest") return savedRole;
    try {
      const stored = localStorage.getItem("coverly_user_profile");
      if (stored) {
        const u = JSON.parse(stored);
        return (u.activeRole || u.roles?.[0] || "buyer") as UserRole;
      }
    } catch {}
    return "guest";
  });

  const loadSession = async () => {
    try {
      const storedUserId = localStorage.getItem("coverly_user_id");
      if (!storedUserId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          "x-user-id": storedUserId,
        },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data.user) {
          const freshUser = body.data.user as UserProfile;
          const freshBusiness = (body.data.business as Business) || null;
          const role = (localStorage.getItem("coverly_active_role") as UserRole) || freshUser.activeRole || "buyer";

          setUser(freshUser);
          setBusiness(freshBusiness);
          setActiveRoleState(role);

          localStorage.setItem("coverly_user_profile", JSON.stringify(freshUser));
          if (freshBusiness) {
            localStorage.setItem("coverly_business_profile", JSON.stringify(freshBusiness));
          }
        }
      } else if (res.status === 401) {
        // Only clear credentials if backend explicitly rejects the session as unauthorized
        localStorage.removeItem("coverly_user_id");
        localStorage.removeItem("coverly_user_profile");
        localStorage.removeItem("coverly_business_profile");
        localStorage.removeItem("coverly_active_role");
        setUser(null);
        setBusiness(null);
        setActiveRoleState("guest");
      }
    } catch {
      // Keep cached session on network errors or serverless wakeup delays
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem("coverly_active_role", role);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        return { success: false, error: body.error || "Login failed" };
      }

      const loggedUser = body.data.user as UserProfile;
      const role = (loggedUser.activeRole || loggedUser.roles?.[0] || "buyer") as UserRole;
      const normalizedUser: UserProfile = {
        ...loggedUser,
        roles: loggedUser.roles?.length ? loggedUser.roles : [role],
        activeRole: role,
        is_active: loggedUser.is_active ?? true,
      };

      const biz = (body.data.business as Business) || null;

      setUser(normalizedUser);
      setBusiness(biz);
      setActiveRole(role);

      localStorage.setItem("coverly_user_id", normalizedUser.id);
      localStorage.setItem("coverly_user_profile", JSON.stringify(normalizedUser));
      localStorage.setItem("coverly_active_role", role);
      if (biz) {
        localStorage.setItem("coverly_business_profile", JSON.stringify(biz));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    phone?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        return { success: false, error: body.error || "Registration failed" };
      }

      const registeredUser = body.data.user as Partial<UserProfile> & { role?: UserRole };
      const role = (registeredUser.activeRole || registeredUser.role || payload.role || "buyer") as UserRole;
      const normalizedUser: UserProfile = {
        id: registeredUser.id || "",
        email: registeredUser.email || payload.email,
        full_name: registeredUser.full_name || payload.full_name,
        phone: payload.phone,
        roles: Array.isArray(registeredUser.roles) && registeredUser.roles.length ? registeredUser.roles : [role],
        activeRole: role,
        is_active: registeredUser.is_active ?? true,
      };

      setUser(normalizedUser);
      setBusiness(null);
      setActiveRole(role);

      localStorage.setItem("coverly_user_id", normalizedUser.id);
      localStorage.setItem("coverly_user_profile", JSON.stringify(normalizedUser));
      localStorage.setItem("coverly_active_role", role);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  };

  const logout = () => {
    try {
      insforge.auth.signOut().catch(() => {});
    } catch {}
    localStorage.removeItem("coverly_user_id");
    localStorage.removeItem("coverly_user_profile");
    localStorage.removeItem("coverly_business_profile");
    localStorage.removeItem("coverly_active_role");
    setUser(null);
    setBusiness(null);
    setActiveRoleState("guest");
  };

  const refreshUser = async () => {
    await loadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isLoading,
        activeRole,
        login,
        register,
        logout,
        setActiveRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
