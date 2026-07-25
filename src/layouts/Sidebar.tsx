import { NavLink } from "react-router-dom";
import {
  FiUsers,
  FiMap,
  FiGrid,
  FiBarChart2,
  FiDollarSign,
  FiCamera,
  FiAlertTriangle,
  FiHome,
  FiLogOut,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const SHOW_FINANCIALS = import.meta.env.VITE_SHOW_FINANCIALS === "true";

// `soon: true` marks features whose backend is not implemented yet — they render
// a "coming soon" placeholder and are flagged with a badge in the nav.
const navigation = [
  { name: "Dashboard", to: "/dashboard", icon: FiHome, soon: true },
  { name: "Παραγωγοί", to: "/producers", icon: FiUsers },
  { name: "Χωράφια", to: "/fields", icon: FiMap },
  { name: "Φυτεύσεις", to: "/plantings", icon: FiGrid },
  { name: "Παραγωγή", to: "/production", icon: FiBarChart2 },
  ...(SHOW_FINANCIALS
    ? [{ name: "Οικονομικά", to: "/financials", icon: FiDollarSign, soon: true }]
    : []),
  { name: "Φωτογραφίες", to: "/field-photos", icon: FiCamera },
  { name: "Προβλήματα", to: "/field-issues", icon: FiAlertTriangle },
];

interface SidebarProps {
  /** Called when a navigation link is followed — used to close the mobile drawer. */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Arta Gold"
          className="h-11 w-11 shrink-0 object-contain"
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">Arta Gold</p>
          <p className="text-xs text-gray-500">SEAPP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
            <span className="flex-1">{item.name}</span>
            {item.soon && (
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                Σύντομα
              </span>
            )}
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
