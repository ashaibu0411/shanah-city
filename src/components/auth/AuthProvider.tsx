"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ActivityItem, PublicMember } from "@/lib/auth-types";

type AuthPermissions = {
  canUploadGallery: boolean;
};

type AuthContextValue = {
  user: PublicMember | null;
  activity: ActivityItem[];
  permissions: AuthPermissions;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: PublicMember | null) => void;
};

const defaultPermissions: AuthPermissions = { canUploadGallery: false };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicMember | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [permissions, setPermissions] = useState<AuthPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth");
    const data = await response.json();
    setUser(data.user ?? null);
    setActivity(data.activity ?? []);
    setPermissions(data.permissions ?? defaultPermissions);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    setActivity([]);
    setPermissions(defaultPermissions);
  }, []);

  const value = useMemo(
    () => ({ user, activity, permissions, loading, refresh, signOut, setUser }),
    [user, activity, permissions, loading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
