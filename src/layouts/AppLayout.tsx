import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the drawer on navigation and when Escape is pressed.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Persistent sidebar (large screens) */}
      <div className="hidden shrink-0 lg:flex">
        <Sidebar />
      </div>

      {/* Off-canvas drawer (small screens) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85%] shadow-xl">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Κλείσιμο μενού"
              className="btn-ghost absolute right-2 top-3 p-2"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with hamburger */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Άνοιγμα μενού"
            className="btn-ghost -ml-2 p-2"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Arta Gold"
              className="h-12 w-12 object-contain p-1"
            />
            <span className="text-sm font-semibold text-gray-900">
              Arta Gold
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
