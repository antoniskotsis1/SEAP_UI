import { useState, useCallback, type ReactNode } from "react";
import {
  AuthContext,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  STORAGE_KEY,
  type AuthUser,
} from "./auth-context";

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network latency so the pending state is visible.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalized = email.trim().toLowerCase();
    if (normalized !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      throw new Error("Λάθος email ή κωδικός πρόσβασης.");
    }

    const nextUser: AuthUser = { name: "Διαχειριστής", email: normalized };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
