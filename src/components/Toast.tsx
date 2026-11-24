import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastMessage | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 pointer-events-none"
    >
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-xl ${
          isError
            ? 'border-rose-400/40 bg-rose-950/85 text-rose-100'
            : 'border-cyan-400/40 bg-[#0b1326]/90 text-cyan-100'
        }`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" aria-hidden="true" />
        )}
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
