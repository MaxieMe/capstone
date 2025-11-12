// resources/js/components/ui/confirm-dialog.tsx
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type Variant = 'default' | 'danger' | 'success';

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
};

type ConfirmDialogContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export const useConfirmDialog = () => {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return ctx;
};

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => () => {});

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleClose = (value: boolean) => {
    setOpen(false);
    resolver(value);
  };

  const colorClasses =
    options.variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : options.variant === 'success'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-violet-600 hover:bg-violet-700';

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {options.title ?? 'Are you sure?'}
              </h2>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {options.message ?? 'Please confirm this action.'}
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 pt-2 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {options.cancelText ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm ${colorClasses}`}
              >
                {options.confirmText ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};
