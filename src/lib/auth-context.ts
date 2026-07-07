import { createContext, useContext } from "react";

export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Resolves on success, throws an Error (with a Greek message) on failure. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const STORAGE_KEY = "seapp.auth.user";

/**
 * Demo credentials for the mock backend. Swap the provider's `login` for a real
 * API call (POST /auth/login) when a backend is available.
 */
export const DEMO_EMAIL = "admin@artagold.gr";
export const DEMO_PASSWORD = "artagold";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
