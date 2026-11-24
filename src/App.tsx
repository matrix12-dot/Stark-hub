import { useCallback, useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CommandCenter } from './components/CommandCenter';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PinModal } from './components/PinModal';
import { ProjectsShowcase } from './components/ProjectsShowcase';
import { Toast, type ToastMessage } from './components/Toast';
import {
  DEFAULT_FOCUS_STATS,
  DEFAULT_PIN,
  DEFAULT_PROJECTS,
  DEFAULT_QUICK_NOTE,
  DEFAULT_SNIPPETS,
  DEFAULT_TASKS,
  STORAGE_KEYS,
} from './data/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import type {
  CodeSnippet,
  FocusStats,
  ProjectItem,
  TodoTask,
  VaultBackupPayload,
} from './types/hub';
import { sha256Hex } from './utils/security';

export default function App() {
  const [projects, setProjects] = useLocalStorage<ProjectItem[]>(
    STORAGE_KEYS.PROJECTS,
    DEFAULT_PROJECTS
  );
  const [snippets, setSnippets] = useLocalStorage<CodeSnippet[]>(
    STORAGE_KEYS.SNIPPETS,
    DEFAULT_SNIPPETS
  );
  const [quickNote, setQuickNote] = useLocalStorage<string>(
    STORAGE_KEYS.QUICK_NOTE,
    DEFAULT_QUICK_NOTE
  );
  const [tasks, setTasks] = useLocalStorage<TodoTask[]>(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  const [focusStats, setFocusStats] = useLocalStorage<FocusStats>(
    STORAGE_KEYS.FOCUS_STATS,
    DEFAULT_FOCUS_STATS
  );

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [modalMode, setModalMode] = useState<'unlock' | 'change' | null>(null);
  const [isDefaultPin, setIsDefaultPin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(STORAGE_KEYS.IS_CUSTOM_PIN) !== 'true';
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToast({ id, text, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2800);
  }, []);

  // Ensure a SHA-256 hash of the default PIN ("2026") is stored on first visit
  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (!existing) {
      void sha256Hex(DEFAULT_PIN).then((hash) => {
        window.localStorage.setItem(STORAGE_KEYS.PIN_HASH, hash);
      });
    }
  }, []);

  // Global shortcut: Ctrl + Shift + K (or Cmd + Shift + K) opens/focuses the stealth vault
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && isK) {
        e.preventDefault();
        if (isVaultUnlocked) {
          setIsVaultUnlocked(false);
          showToast('تم قفل مركز القيادة.');
        } else {
          setModalMode('unlock');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVaultUnlocked, showToast]);

  const handleVerifyUnlock = async (enteredPin: string): Promise<boolean> => {
    const storedHash =
      window.localStorage.getItem(STORAGE_KEYS.PIN_HASH) ||
      (await sha256Hex(DEFAULT_PIN));
    const candidateHash = await sha256Hex(enteredPin);

    if (candidateHash === storedHash) {
      setIsVaultUnlocked(true);
      setModalMode(null);
      showToast('تم فتح مركز القيادة السري.');
      window.setTimeout(() => {
        document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      return true;
    }
    return false;
  };

  const handleChangePin = async (
    currentPin: string,
    newPin: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const storedHash =
      window.localStorage.getItem(STORAGE_KEYS.PIN_HASH) ||
      (await sha256Hex(DEFAULT_PIN));
    const currentHash = await sha256Hex(currentPin);

    if (currentHash !== storedHash) {
      return { ok: false, error: 'الرمز الحالي غير صحيح.' };
    }

    const nextHash = await sha256Hex(newPin);
    window.localStorage.setItem(STORAGE_KEYS.PIN_HASH, nextHash);
    window.localStorage.setItem(STORAGE_KEYS.IS_CUSTOM_PIN, 'true');
    setIsDefaultPin(false);
    setModalMode(null);
    showToast('تم تحديث رمز المرور وتشفيره بنجاح.');
    return { ok: true };
  };

  const handleRestoreBackup = (payload: VaultBackupPayload) => {
    setProjects(payload.projects);
    setSnippets(payload.snippets);
    setQuickNote(payload.quickNote);
    setTasks(payload.tasks);
    setFocusStats(payload.focusStats);
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    showToast('تم قفل الخزنة وإخفاء مساحة العمل.');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 deep-space-grid flex flex-col">
      <Navbar isVaultUnlocked={isVaultUnlocked} />

      <main className="flex-1">
        <HeroSection />
        <ProjectsShowcase projects={projects} />

        <AnimatePresence>
          {isVaultUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <CommandCenter
                projects={projects}
                onProjectsChange={setProjects}
                snippets={snippets}
                onSnippetsChange={setSnippets}
                quickNote={quickNote}
                onQuickNoteChange={setQuickNote}
                tasks={tasks}
                onTasksChange={setTasks}
                focusStats={focusStats}
                onFocusStatsChange={setFocusStats}
                onRestoreBackup={handleRestoreBackup}
                onOpenChangePin={() => setModalMode('change')}
                onLockVault={handleLockVault}
                onNotify={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800/60 py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <p>
            © {new Date().getFullYear()} Stark Hub ·{' '}
            <a
              href="https://github.com/matrix12-dot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-slate-300 hover:text-cyan-300 transition-colors"
            >
              matrix12-dot
            </a>
          </p>

          <p className="font-mono text-[11px] text-slate-500">
            Static Edge Build · Client-Side Only
          </p>
        </div>
      </footer>

      {/* Subtle Stealth Vault Trigger in Bottom-Left Corner */}
      <button
        type="button"
        onClick={() => {
          if (isVaultUnlocked) {
            handleLockVault();
          } else {
            setModalMode('unlock');
          }
        }}
        title={isVaultUnlocked ? 'قفل مركز القيادة (Ctrl+Shift+K)' : 'مركز القيادة (Ctrl+Shift+K)'}
        aria-label={isVaultUnlocked ? 'قفل مركز القيادة' : 'فتح مركز القيادة السري'}
        className={`fixed bottom-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          isVaultUnlocked
            ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200 opacity-90 hover:bg-cyan-500/30'
            : 'border-slate-800/80 bg-[#070b18]/75 text-slate-500 opacity-55 hover:border-cyan-400/40 hover:text-cyan-300 hover:opacity-100'
        }`}
      >
        {isVaultUnlocked ? (
          <Unlock className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Lock className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <PinModal
        isOpen={modalMode !== null}
        mode={modalMode === 'change' ? 'change' : 'unlock'}
        isDefaultPin={isDefaultPin}
        onClose={() => setModalMode(null)}
        onVerifyUnlock={handleVerifyUnlock}
        onChangePin={handleChangePin}
      />

      <Toast toast={toast} />
    </div>
  );
}
