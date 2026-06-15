import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible native <select> wrapper. Uses useId to guarantee label↔select
 * association even when multiple instances render on the same page.
 */
export function SelectField({
  label,
  required,
  children,
  className,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select id={id} className="input" {...selectProps}>
        {children}
      </select>
    </div>
  );
}
