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
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", to: "/", icon: FiHome },
  { name: "Παραγωγοί", to: "/business-entities", icon: FiUsers },
  { name: "Χωράφια", to: "/fields", icon: FiMap },
  { name: "Φυτεύσεις", to: "/plantings", icon: FiGrid },
  { name: "Παραγωγή", to: "/production", icon: FiBarChart2 },
  { name: "Οικονομικά", to: "/financials", icon: FiDollarSign },
  { name: "Φωτογραφίες", to: "/field-photos", icon: FiCamera },
  { name: "Προβλήματα", to: "/field-issues", icon: FiAlertTriangle },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
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
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
