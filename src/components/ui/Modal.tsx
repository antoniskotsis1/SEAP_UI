import type { ReactNode } from "react";
import {
  Modal as AriaModal,
  ModalOverlay,
  Dialog,
  Heading,
} from "react-aria-components";
import { FiX } from "react-icons/fi";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <AriaModal className={cn("relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl bg-white shadow-xl outline-none", wide ? "max-w-3xl" : "max-w-lg")}>
        {/*
         * Dialog provides role="dialog", aria-modal="true", and associates
         * the Heading below as aria-labelledby automatically.
         */}
        <Dialog className="flex min-h-0 flex-col outline-none">
          {({ close }) => (
            <>
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
                <Heading
                  slot="title"
                  className="text-base font-semibold text-gray-900 sm:text-lg"
                >
                  {title}
                </Heading>
                <Button
                  variant="ghost"
                  onPress={close}
                  aria-label="Κλείσιμο"
                  className="p-1"
                >
                  <FiX className="h-5 w-5" />
                </Button>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-4 py-4 sm:px-6">
                  {footer}
                </div>
              )}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
