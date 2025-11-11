// resources/js/Components/FlashToast.tsx
import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

type FlashProps = {
  flash?: {
    success?: string;
    error?: string;
  };
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

export default function FlashToast() {
  const { flash } = usePage<FlashProps>().props;
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const success = flash?.success;
    const error = flash?.error;

    if (success) {
      setToast({ type: "success", message: success });
      setVisible(true);
    } else if (error) {
      setToast({ type: "error", message: error });
      setVisible(true);
    } else {
      return;
    }

    // ⏱ auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [flash?.success, flash?.error]);

  if (!toast || !visible) return null;

  const isSuccess = toast.type === "success";

  return (
    <div className="fixed z-[9999] bottom-6 right-4 sm:right-6">
      <div
        className={`max-w-xs sm:max-w-sm px-4 py-3 rounded-xl shadow-lg border text-sm flex items-start gap-2
        ${
          isSuccess
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}
      >
        <div className="mt-0.5">
          {isSuccess ? "✅" : "⚠️"}
        </div>
        <div className="flex-1">
          <p className="font-semibold mb-0.5">
            {isSuccess ? "Success" : "Something went wrong"}
          </p>
          <p className="text-xs leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 text-xs opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
