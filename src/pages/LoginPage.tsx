import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiLoader,
  FiMap,
  FiBarChart2,
  FiCamera,
} from "react-icons/fi";
import { useAuth } from "@/lib/auth-context";

const highlights = [
  { icon: FiMap, text: "Χωράφια & φυτεύσεις σε ένα σημείο" },
  { icon: FiBarChart2, text: "Παραγωγή, εκτιμήσεις & εκκαθαρίσεις" },
  { icon: FiCamera, text: "Φωτογραφική τεκμηρίωση εργασιών" },
];

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Where to go after a successful login (falls back to the dashboard).
  const from =
    (location.state as { from?: string } | null)?.from ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Η σύνδεση απέτυχε. Δοκιμάστε ξανά.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-base font-bold text-white shadow-lg">
            AG
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Arta Gold</p>
            <p className="text-sm text-brand-100">SEAPP</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Διαχείριση παραγωγής
            <br />
            ακτινιδίων, οργανωμένα.
          </h1>
          <p className="mt-4 text-brand-100">
            Παραγωγοί, χωράφια, παραγωγή και τεκμηρίωση — όλα σε μία πλατφόρμα.
          </p>

          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-brand-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} Arta Gold · Εσωτερική εφαρμογή
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo for small screens */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-sm font-bold text-white">
              AG
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">Arta Gold</p>
              <p className="text-xs text-gray-500">SEAPP</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Καλώς ήρθατε</h2>
          <p className="mt-1 text-sm text-gray-500">
            Συνδεθείτε στον λογαριασμό σας για να συνεχίσετε.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@artagold.gr"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Κωδικός πρόσβασης
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input px-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Να με θυμάσαι
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full"
            >
              {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
              {isPending ? "Σύνδεση…" : "Σύνδεση"}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-gray-100 px-3 py-2.5 text-center text-xs text-gray-500">
            Δοκιμαστικά στοιχεία:{" "}
            <span className="font-medium text-gray-700">admin@artagold.gr</span>{" "}
            / <span className="font-medium text-gray-700">artagold</span>
          </p>
        </div>
      </div>
    </div>
  );
}
