import React from "react";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "mint";
  isLoading?: boolean;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isLoading = false,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="mint"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
