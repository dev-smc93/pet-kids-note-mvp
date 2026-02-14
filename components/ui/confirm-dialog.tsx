"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "danger";
  showCancel?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  variant = "default",
  showCancel = true,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <AlertDialog.Title className="text-lg font-semibold text-zinc-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-zinc-600">
            {description}
          </AlertDialog.Description>
          <div className={`mt-6 flex gap-3 ${!showCancel ? "justify-end" : ""}`}>
            {showCancel && (
              <AlertDialog.Cancel asChild>
                <Button variant="outline" className="flex-1">
                  {cancelText}
                </Button>
              </AlertDialog.Cancel>
            )}
            <Button
              type="button"
              variant={variant === "danger" ? "danger" : "primary"}
              className={showCancel ? "flex-1" : "min-w-[100px]"}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
