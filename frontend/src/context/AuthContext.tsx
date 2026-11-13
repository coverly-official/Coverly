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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRole, setActiveRoleState] = useState<UserRole>("guest");

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
          setUser(body.data.user);
          setBusiness(body.data.business || null);
          const savedRole = (localStorage.getItem("coverly_active_role") as UserRole) || body.data.user.activeRole;
          setActiveRoleState(savedRole);
        }
      } else {
        localStorage.removeItem("coverly_user_id");
        localStorage.removeItem("coverly_active_role");
      }
    } catch {
      // Fallback
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

      const loggedUser = body.data.user;
      setUser(loggedUser);
      setBusiness(body.data.business || null);
      setActiveRole(loggedUser.activeRole);
      localStorage.setItem("coverly_user_id", loggedUser.id);
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

      const registeredUser = body.data.user;
      setUser(registeredUser);
      setActiveRole(registeredUser.role);
      localStorage.setItem("coverly_user_id", registeredUser.id);
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
