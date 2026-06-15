import { Button as AriaButton, type ButtonProps } from "react-aria-components";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

interface Props extends ButtonProps {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <AriaButton
      className={cn(variantClass[variant], className)}
      {...props}
    />
  );
}
