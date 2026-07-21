/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { HighlightQuoted } from '../components/ui/HighlightQuoted';

/**
 * Hộp thoại xác nhận dùng chung, thay cho window.confirm() của trình duyệt —
 * hộp thoại mặc định hiện tên domain và nút tiếng Việt của trình duyệt, không
 * khớp giao diện của web. Dùng như confirm() cũ: `if (!(await confirm({...}))) return;`
 */
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** danger = hành động không hoàn tác được (xoá, huỷ) → nút đỏ */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const useConfirm = (): ConfirmFn => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AnimatePresence>
        {options && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-2xl p-7 w-full max-w-md border border-gold/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />

              <div className="relative flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${options.danger ? 'bg-red-500/10 border-red-500/25' : 'bg-gold/10 border-gold/20'}`}>
                  <AlertTriangle size={15} className={options.danger ? 'text-red-400' : 'text-gold'} />
                </div>
                <h2 className="text-lg font-serif text-white">{options.title ?? 'Confirmation'}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>

              <p className="relative text-sm text-muted leading-relaxed">
                <HighlightQuoted text={options.message} />
              </p>

              <div className="relative flex gap-3 mt-6">
                <button
                  onClick={() => close(false)}
                  className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                >
                  {options.cancelText ?? 'Cancel'}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${options.danger
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                    : 'bg-gold/20 text-gold border-gold/30 hover:bg-gold/30'}`}
                >
                  {options.confirmText ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
