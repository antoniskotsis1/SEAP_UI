import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Called when the primary (submit) button is pressed. */
  onSubmit: () => void;
  /** Disables the submit button and swaps its label while a request is in flight. */
  saving: boolean;
  submitLabel?: string;
  wide?: boolean;
  children: ReactNode;
}

/**
 * `Modal` preconfigured with the standard create/edit footer
 * (Cancel + Submit with saving state) shared by every list page's form dialog.
 */
export function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  saving,
  submitLabel = "Δημιουργία",
  wide,
  children,
}: FormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      wide={wide}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Ακύρωση
          </Button>
          <Button onPress={onSubmit} isDisabled={saving}>
            {saving ? "Αποθήκευση…" : submitLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
