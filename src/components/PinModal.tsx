import { useEffect, useRef, useState } from 'react';
import { Delete, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'change';
  isDefaultPin: boolean;
  onClose: () => void;
  onVerifyUnlock: (pin: string) => Promise<boolean>;
  onChangePin: (currentPin: string, newPin: string) => Promise<{ ok: boolean; error?: string }>;
}

export function PinModal({
  isOpen,
  mode,
  isDefaultPin,
  onClose,
  onVerifyUnlock,
  onChangePin,
}: PinModalProps) {
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUnlockSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    const ok = await onVerifyUnlock(pin.trim());
    setIsSubmitting(false);
    if (!ok) {
      setError('رمز المرور غير صحيح. حاول مرة أخرى.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (newPin.trim().length < 4) {
      setError('يجب أن يتكون الرمز الجديد من 4 أحرف أو أرقام على الأقل.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('تأكيد الرمز الجديد غير متطابق.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const result = await onChangePin(currentPin.trim(), newPin.trim());
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'تعذر تحديث الرمز.');
    }
  };

  const appendDigit = (digit: string) => {
    if (pin.length >= 12) return;
    setError('');
    setPin((prev) => prev + digit);
  };

  const backspaceDigit = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040a]/80 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="liquid-glass w-full max-w-md rounded-2xl border border-cyan-400/25 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              {mode === 'unlock' ? (
                <Lock className="h-5 w-5" aria-hidden="true" />
              ) : (
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="vault-modal-title" className="text-lg font-bold text-slate-50">
                {mode === 'unlock' ? 'فتح مركز القيادة السري' : 'تغيير رمز الخزنة'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'unlock'
                  ? 'أدخل رمز المرور للوصول إلى مساحة العمل الخاصة'
                  : 'يتم حفظ الرمز محلياً بتشفير SHA-256'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {mode === 'unlock' ? (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label htmlFor="vault-pin-input" className="sr-only">
                رمز المرور
              </label>
              <input
                ref={inputRef}
                id="vault-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder="••••"
                dir="ltr"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-4 py-3 text-center font-mono text-2xl tracking-[0.45em] text-cyan-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            {error && (
              <p role="alert" className="text-center text-xs font-medium text-rose-400">
                {error}
              </p>
            )}

            {isDefaultPin && !error && (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden="true" />
                <span>
                  الرمز الافتراضي للزيارة الأولى: <span className="font-mono text-cyan-300">2026</span>
                </span>
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  className="min-h-[44px] rounded-xl border border-slate-800 bg-slate-900/70 font-mono text-base font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-slate-800/80 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={backspaceDigit}
                aria-label="حذف رقم"
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Delete className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => appendDigit('0')}
                className="min-h-[44px] rounded-xl border border-slate-800 bg-slate-900/70 font-mono text-base font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-slate-800/80 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                0
              </button>
              <button
                type="submit"
                disabled={!pin.trim() || isSubmitting}
                className="min-h-[44px] rounded-xl bg-cyan-400 font-sans text-xs font-bold text-[#050811] transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                دخول
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangeSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-pin" className="mb-1.5 block text-xs font-medium text-slate-300">
                الرمز الحالي
              </label>
              <input
                ref={inputRef}
                id="current-pin"
                type="password"
                autoComplete="off"
                value={currentPin}
                onChange={(e) => {
                  setError('');
                  setCurrentPin(e.target.value);
                }}
                dir="ltr"
                required
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            <div>
              <label htmlFor="new-pin" className="mb-1.5 block text-xs font-medium text-slate-300">
                الرمز الجديد (4 خانات فأكثر)
              </label>
              <input
                id="new-pin"
                type="password"
                autoComplete="off"
                value={newPin}
                onChange={(e) => {
                  setError('');
                  setNewPin(e.target.value);
                }}
                dir="ltr"
                required
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            <div>
              <label htmlFor="confirm-pin" className="mb-1.5 block text-xs font-medium text-slate-300">
                تأكيد الرمز الجديد
              </label>
              <input
                id="confirm-pin"
                type="password"
                autoComplete="off"
                value={confirmPin}
                onChange={(e) => {
                  setError('');
                  setConfirmPin(e.target.value);
                }}
                dir="ltr"
                required
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-[#050811] hover:bg-cyan-300 disabled:opacity-50"
              >
                حفظ الرمز الجديد
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
