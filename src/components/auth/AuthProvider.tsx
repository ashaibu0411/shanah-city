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
import { syncAppIconBadgeCount } from "@/lib/app-icon-badge";

type AuthPermissions = {
  canUploadGallery: boolean;
  canManageLiveStream: boolean;
  canWriteDevotions: boolean;
  canManageAdmin: boolean;
  canAccessFinance: boolean;
  canAccessWorshipPlanner: boolean;
  canManageWorshipPlan: boolean;
  canAccessFrontLiners: boolean;
  canManageFrontLiners: boolean;
  canAccessFollowUp: boolean;
  canManageFollowUp: boolean;
  canManageGuestSubmissions: boolean;
  canAccessKidsMinistry: boolean;
  canManageKidsMinistry: boolean;
  canSubmitMinistryReports: boolean;
  canShowLeaderReportHomeBanner: boolean;
  canReviewMinistryReports: boolean;
  canSeeGuestHomeBanner: boolean;
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

const defaultPermissions: AuthPermissions = {
  canUploadGallery: false,
  canManageLiveStream: false,
  canWriteDevotions: false,
  canManageAdmin: false,
  canAccessFinance: false,
  canAccessWorshipPlanner: false,
  canManageWorshipPlan: false,
  canAccessFrontLiners: false,
  canManageFrontLiners: false,
  canAccessFollowUp: false,
  canManageFollowUp: false,
  canManageGuestSubmissions: false,
  canAccessKidsMinistry: false,
  canManageKidsMinistry: false,
  canSubmitMinistryReports: false,
  canShowLeaderReportHomeBanner: false,
  canReviewMinistryReports: false,
  canSeeGuestHomeBanner: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicMember | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [permissions, setPermissions] = useState<AuthPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        user?: PublicMember | null;
        activity?: ActivityItem[];
        permissions?: AuthPermissions;
      };
      setUser(data.user ?? null);
      setActivity(data.activity ?? []);
      setPermissions(data.permissions ?? defaultPermissions);
    } catch {
      setUser(null);
      setActivity([]);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading || !user) return;
    void import("@/lib/native-push-client").then(async (nativePush) => {
      if (nativePush.isNativePushOptedOut()) return;
      await nativePush.ensureNativePushRegistered();
      await nativePush.watchNativePushResync(() => {
        window.dispatchEvent(new Event("shanah-push-synced"));
      });
    });
  }, [loading, user]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    setActivity([]);
    setPermissions(defaultPermissions);
    void syncAppIconBadgeCount(0);
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
