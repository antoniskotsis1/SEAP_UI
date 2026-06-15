import {
  TextField as AriaTextField,
  Label,
  Input,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends Omit<AriaTextFieldProps, "children" | "className"> {
  label: string;
  placeholder?: string;
  /** Pass type, step, min, max, and any other input-specific attrs here */
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "className">;
  className?: string;
}

export function TextField({
  label,
  isRequired,
  placeholder,
  inputProps,
  className,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      isRequired={isRequired}
      {...props}
      className={cn("flex flex-col", className)}
    >
      <Label className="label">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Input className="input" placeholder={placeholder} {...inputProps} />
    </AriaTextField>
  );
}
