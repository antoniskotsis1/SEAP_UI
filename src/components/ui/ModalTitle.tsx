import type { ReactNode } from "react";

interface ModalTitleProps {
  /** Icon or initials shown in the avatar. */
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Avatar color classes (defaults to the brand tint). */
  iconClassName?: string;
}

/**
 * Shared modal header: an avatar + title (+ optional subtitle). Used by both the
 * read-only detail modals and their edit forms so the header stays consistent
 * across the view → edit switch.
 */
export function ModalTitle({
  icon,
  title,
  subtitle,
  iconClassName = "bg-brand-100 text-brand-700",
}: ModalTitleProps) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate leading-tight">{title}</span>
        {subtitle != null && subtitle !== "" && (
          <span className="truncate text-xs font-normal text-gray-500">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
