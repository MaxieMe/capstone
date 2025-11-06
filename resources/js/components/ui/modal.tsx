import * as React from "react";
import { Dialog } from "@headlessui/react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Modal({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ModalProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    if (typeof open === "boolean") setIsOpen(open);
  }, [open]);

  const handleClose = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={cn(
            "bg-white dark:bg-neutral-900 rounded-2xl shadow-lg w-full max-w-md transform transition-all"
          )}
        >
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn("p-6 text-center space-y-4", className)}>
      {children}
    </div>
  );
}
