import { useEffect, useState } from 'react';
import { Bell, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { FocusStats } from '../../types/hub';
import { playAmbientChime } from '../../utils/audio';

interface FocusTimerTabProps {
  stats: FocusStats;
  onUpdateStats: (next: FocusStats) => void;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

type PresetKey = 'focus' | 'short' | 'long';

const PRESETS: Record<PresetKey, { label: string; minutes: number }> = {
  focus: { label: 'تركيز عميق · 25د', minutes: 25 },
  short: { label: 'استراحة قصيرة · 5د', minutes: 5 },
  long: { label: 'استراحة طويلة · 15د', minutes: 15 },
};

export function FocusTimerTab({ stats, onUpdateStats, onNotify }: FocusTimerTabProps) {
  const [preset, setPreset] = useState<PresetKey>('focus');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const totalSeconds = PRESETS[preset].minutes * 60;
  const progress = Math.max(0, Math.min(1, (totalSeconds - secondsLeft) / totalSeconds));

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);

          if (!isMuted) {
            playAmbientChime();
          }

          if (preset === 'focus') {
            onUpdateStats({
              completedSessions: stats.completedSessions + 1,
              totalFocusMinutes: stats.totalFocusMinutes + PRESETS.focus.minutes,
              lastSessionDate: new Date().toISOString(),
            });
            onNotify('انتهت جلسة التركيز بنجاح! أحسنت.');
          } else {
            onNotify('انتهت الاستراحة، حان وقت العودة للعمل.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, isMuted, preset, stats, onUpdateStats, onNotify]);

  const handleSelectPreset = (key: PresetKey) => {
    setIsRunning(false);
    setPreset(key);
    setSecondsLeft(PRESETS[key].minutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(PRESETS[preset].minutes * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 84;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800/85 bg-[#060a16]/75 p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSelectPreset(key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              preset === key
                ? 'border border-cyan-400/45 bg-cyan-500/20 text-cyan-200'
                : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {PRESETS[key].label}
          </button>
        ))}
      </div>

      <div className="relative mx-auto my-6 flex h-52 w-52 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 192 192" aria-hidden="true">
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="rgba(148, 163, 184, 0.14)"
            strokeWidth="8"
          />
          <circle
            cx="96"
            cy="96"
            r="84"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-300"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            dir="ltr"
            className="font-mono text-4xl font-bold tracking-tight text-slate-50 tabular-nums sm:text-5xl"
          >
            {mins}:{secs}
          </span>
          <span className="mt-1.5 text-xs text-slate-400">
            {preset === 'focus' ? 'جلسة عمل مركزة' : 'وقت استراحة'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (secondsLeft === 0) {
              setSecondsLeft(PRESETS[preset].minutes * 60);
            }
            setIsRunning((prev) => !prev);
          }}
          className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#050811] transition-colors hover:bg-cyan-300"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4" aria-hidden="true" />
              <span>إيقاف مؤقت</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>بدء المؤقت</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-500"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>إعادة ضبط</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          aria-label={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-500"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          )}
          <span>{isMuted ? 'مكتوم' : 'الصوت مفعل'}</span>
        </button>

        <button
          type="button"
          onClick={() => playAmbientChime()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 px-3.5 py-2.5 text-xs text-slate-400 hover:border-violet-400/40 hover:text-violet-200"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          <span>اختبار النغمة</span>
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/80 pt-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>الجلسات المكتملة:</span>
          <span className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
            {stats.completedSessions}
          </span>
        </div>
        <span className="text-slate-700" aria-hidden="true">
          ·
        </span>
        <div className="flex items-center gap-2">
          <span>إجمالي دقائق التركيز:</span>
          <span className="font-mono text-sm font-bold text-violet-300 tabular-nums">
            {stats.totalFocusMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}
