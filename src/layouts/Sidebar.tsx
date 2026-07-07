import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiMap,
  FiGrid,
  FiBarChart2,
  FiDollarSign,
  FiCamera,
  FiAlertTriangle,
  FiHome,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const SHOW_FINANCIALS = import.meta.env.VITE_SHOW_FINANCIALS === "true";

const navigation = [
  { name: "Χωράφια", to: "/fields", icon: FiMap },
  { name: "Φυτεύσεις", to: "/plantings", icon: FiGrid },
  { name: "Παραγωγή", to: "/production", icon: FiBarChart2 },
  ...(SHOW_FINANCIALS
    ? [{ name: "Οικονομικά", to: "/financials", icon: FiDollarSign }]
    : []),
  { name: "Φωτογραφίες", to: "/field-photos", icon: FiCamera },
  { name: "Προβλήματα", to: "/field-issues", icon: FiAlertTriangle },
];

const producerStatuses = [
  { label: "Ενεργός", value: "ACTIVE", to: "/producers?status=ACTIVE" },
  {
    label: "Ανενεργός",
    value: "INACTIVE",
    to: "/producers?status=INACTIVE",
  },
  { label: "Lead", value: "LEAD", to: "/producers?status=LEAD" },
];

interface SidebarProps {
  /** Called when a navigation link is followed — used to close the mobile drawer. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isOnProducers = location.pathname.startsWith("/producers");
  const [producersOpen, setProducersOpen] = useState(isOnProducers);

  useEffect(() => {
    if (isOnProducers) {
      setProducersOpen(true);
    }
  }, [isOnProducers]);

  const currentStatus = new URLSearchParams(location.search).get("status");

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-white">
          AG
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Arta Gold</p>
          <p className="text-xs text-gray-500">SEAPP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )
          }
        >
          <FiHome className="h-5 w-5 shrink-0" />
          Dashboard
        </NavLink>

        {/* Παραγωγοί — expandable */}
        <div>
          <button
            onClick={() => setProducersOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isOnProducers
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <FiUsers className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Παραγωγοί</span>
            {producersOpen ? (
              <FiChevronDown className="h-4 w-4" />
            ) : (
              <FiChevronRight className="h-4 w-4" />
            )}
          </button>

          {producersOpen && (
            <div className="ml-8 mt-1 space-y-1">
              {producerStatuses.map((s) => {
                const isActive = isOnProducers && currentStatus === s.value;
                return (
                  <NavLink
                    key={s.value}
                    to={s.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    {s.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <FiLogOut className="h-5 w-5 shrink-0" />
            Αποσύνδεση
          </button>
        </div>
      )}
    </aside>
  );
}
