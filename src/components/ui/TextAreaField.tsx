import {
  TextField as AriaTextField,
  Label,
  TextArea,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cn } from "@/lib/utils";

interface TextAreaFieldProps
  extends Omit<AriaTextFieldProps, "children" | "className"> {
  label: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextAreaField({
  label,
  isRequired,
  placeholder,
  rows = 3,
  className,
  ...props
}: TextAreaFieldProps) {
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
      <TextArea className="input" placeholder={placeholder} rows={rows} />
    </AriaTextField>
  );
}
