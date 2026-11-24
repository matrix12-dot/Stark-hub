import { useRef, useState } from 'react';
import {
  Download,
  FolderKanban,
  KeyRound,
  Lock,
  StickyNote,
  Terminal,
  Timer,
  Upload,
} from 'lucide-react';
import type {
  CodeSnippet,
  FocusStats,
  ProjectItem,
  TodoTask,
  VaultBackupPayload,
  VaultTabId,
} from '../types/hub';
import { validateBackupPayload } from '../utils/security';
import { CodeVaultTab } from './vault/CodeVaultTab';
import { FocusTimerTab } from './vault/FocusTimerTab';
import { NotesTasksTab } from './vault/NotesTasksTab';
import { PortfolioManagerTab } from './vault/PortfolioManagerTab';

interface CommandCenterProps {
  projects: ProjectItem[];
  onProjectsChange: (next: ProjectItem[]) => void;
  snippets: CodeSnippet[];
  onSnippetsChange: (next: CodeSnippet[]) => void;
  quickNote: string;
  onQuickNoteChange: (next: string) => void;
  tasks: TodoTask[];
  onTasksChange: (next: TodoTask[]) => void;
  focusStats: FocusStats;
  onFocusStatsChange: (next: FocusStats) => void;
  onRestoreBackup: (payload: VaultBackupPayload) => void;
  onOpenChangePin: () => void;
  onLockVault: () => void;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

const TABS: Array<{ id: VaultTabId; label: string; icon: typeof Terminal }> = [
  { id: 'snippets', label: 'مخزن الأكواد والأوامر', icon: Terminal },
  { id: 'notes', label: 'المفكرة والمهام', icon: StickyNote },
  { id: 'focus', label: 'مؤقت التركيز العميق', icon: Timer },
  { id: 'portfolio', label: 'إدارة المشاريع', icon: FolderKanban },
];

export function CommandCenter({
  projects,
  onProjectsChange,
  snippets,
  onSnippetsChange,
  quickNote,
  onQuickNoteChange,
  tasks,
  onTasksChange,
  focusStats,
  onFocusStatsChange,
  onRestoreBackup,
  onOpenChangePin,
  onLockVault,
  onNotify,
}: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<VaultTabId>('snippets');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    const payload: VaultBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      snippets,
      quickNote,
      tasks,
      focusStats,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `stark-hub-backup-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('تم تصدير النسخة الاحتياطية (JSON) بنجاح.');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const validated = validateBackupPayload(parsed);
      if (!validated) {
        onNotify('ملف النسخة الاحتياطية غير صالح أو تالف.', 'error');
        return;
      }
      onRestoreBackup(validated);
      onNotify('تم استيراد البيانات وتعقيمها بنجاح.');
    } catch {
      onNotify('تعذر قراءة ملف JSON المحدد.', 'error');
    }
  };

  return (
    <section
      id="command-center"
      aria-label="مركز القيادة السري"
      className="py-10 sm:py-14 border-t border-cyan-500/20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="liquid-glass rounded-2xl border border-cyan-400/25 p-5 sm:p-7">
          {/* Header Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-xl font-bold text-slate-50 sm:text-2xl">
                  مركز القيادة السري
                </h2>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-xs text-cyan-300">Command Center</span>
              </div>
              <p className="text-xs text-slate-400">
                بياناتك محفوظة محلياً في المتصفح مع دعم النسخ الاحتياطي السريع.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="hidden"
                aria-label="استيراد ملف نسخة احتياطية"
              />

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تصدير JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-400/50 hover:text-violet-200 whitespace-nowrap shrink-0"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>استيراد JSON</span>
              </button>

              <button
                type="button"
                onClick={onOpenChangePin}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تغيير الرمز</span>
              </button>

              <button
                type="button"
                onClick={onLockVault}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-200 transition-colors hover:bg-rose-500/25 whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>قفل الخزنة</span>
              </button>
            </div>
          </div>

          {/* Segmented Tab Navigation */}
          <div
            role="tablist"
            aria-label="أقسام مركز القيادة"
            className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/90 bg-[#040710]/90 p-1.5"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex flex-1 min-w-[150px] items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/35 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          <div role="tabpanel">
            {activeTab === 'snippets' && (
              <CodeVaultTab
                snippets={snippets}
                onChange={onSnippetsChange}
                onNotify={onNotify}
              />
            )}
            {activeTab === 'notes' && (
              <NotesTasksTab
                quickNote={quickNote}
                onQuickNoteChange={onQuickNoteChange}
                tasks={tasks}
                onTasksChange={onTasksChange}
                onNotify={onNotify}
              />
            )}
            {activeTab === 'focus' && (
              <FocusTimerTab
                stats={focusStats}
                onUpdateStats={onFocusStatsChange}
                onNotify={onNotify}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioManagerTab
                projects={projects}
                onChange={onProjectsChange}
                onNotify={onNotify}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
