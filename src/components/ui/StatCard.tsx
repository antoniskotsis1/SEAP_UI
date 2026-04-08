import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("card px-5 py-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend.positive ? "text-green-600" : "text-red-600"
          )}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}
