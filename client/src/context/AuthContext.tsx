"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, storeToken, clearToken } from "@/lib/api";

interface AdminUser {
  email: string;
  name: string;
  token: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  const login = useCallback(async (idToken: string) => {
    const result = await apiFetch<{ token: string; email: string; name: string }>(
      "/api/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ idToken }),
      }
    );
    storeToken(result.token, true);
    setUser({ email: result.email, name: result.name, token: result.token });
    // Also set a cookie so the middleware can check it
    document.cookie = `phitdev_admin_token=${result.token}; path=/; max-age=43200; SameSite=Lax`;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    document.cookie = "phitdev_admin_token=; path=/; max-age=0";
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
