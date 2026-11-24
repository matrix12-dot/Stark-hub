import { useMemo, useState } from 'react';
import { Check, Copy, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { TaskPriority, TodoTask } from '../../types/hub';
import { sanitizeCommandText, sanitizeText } from '../../utils/security';

interface NotesTasksTabProps {
  quickNote: string;
  onQuickNoteChange: (note: string) => void;
  tasks: TodoTask[];
  onTasksChange: (tasks: TodoTask[]) => void;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

const PRIORITY_META: Record<TaskPriority, { label: string; colorClass: string }> = {
  high: { label: 'عالية · High', colorClass: 'text-rose-300' },
  medium: { label: 'متوسطة · Medium', colorClass: 'text-amber-300' },
  low: { label: 'منخفضة · Low', colorClass: 'text-cyan-300' },
};

export function NotesTasksTab({
  quickNote,
  onQuickNoteChange,
  tasks,
  onTasksChange,
  onNotify,
}: NotesTasksTabProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'done'>('all');

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'active') return tasks.filter((t) => !t.completed);
    if (taskFilter === 'done') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, taskFilter]);

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = sanitizeText(newTaskTitle, 200);
    if (!safeTitle) return;

    const item: TodoTask = {
      id: crypto.randomUUID(),
      title: safeTitle,
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    onTasksChange([item, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter((t) => t.id !== id));
  };

  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(quickNote);
      onNotify('تم نسخ المفكرة السريعة.');
    } catch {
      onNotify('تعذر النسخ إلى الحافظة.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Quick Scratchpad */}
      <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800/85 bg-[#060a16]/75 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-violet-300" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-100">المفكرة السريعة</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {quickNote.length} حرف
            </span>
            <button
              type="button"
              onClick={() => void handleCopyNote()}
              aria-label="نسخ نص المفكرة"
              className="rounded-lg border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <textarea
          value={quickNote}
          onChange={(e) => onQuickNoteChange(sanitizeCommandText(e.target.value, 15000))}
          rows={12}
          placeholder="دوّن أفكارك السريعة، مسودات البرومبت، أو الملاحظات التقنية هنا... (يُحفظ تلقائياً)"
          className="w-full flex-1 resize-y rounded-xl border border-slate-800 bg-[#03050c] p-3.5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-violet-400/60 focus:outline-none"
        />
      </div>

      {/* Tasks Checklist */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800/85 bg-[#060a16]/75 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-sm font-bold text-slate-100">قائمة المهام اليومية</h3>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {completedCount}/{tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#040710] p-1">
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'active', label: 'قيد التنفيذ' },
                { id: 'done', label: 'مكتملة' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTaskFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  taskFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddTask} className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="أضف مهمة جديدة..."
            className="flex-1 min-w-[180px] rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <select
            aria-label="أولوية المهمة"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
            className="rounded-xl border border-slate-700/80 bg-[#040710] px-3 py-2 text-xs font-semibold text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="high">أولوية عالية</option>
            <option value="medium">أولوية متوسطة</option>
            <option value="low">أولوية منخفضة</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-[#050811] hover:bg-cyan-300 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>إضافة</span>
          </button>
        </form>

        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              لا توجد مهام في هذا القسم.
            </p>
          ) : (
            filteredTasks.map((task) => {
              const priority = PRIORITY_META[task.priority];
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#040710]/80 px-3.5 py-2.5 transition-colors hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex flex-1 items-center gap-3 text-right min-w-0"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        task.completed
                          ? 'border-cyan-400 bg-cyan-400 text-[#050811]'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          task.completed ? 'text-slate-500 line-through' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-medium ${priority.colorClass}`}>
                      {priority.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`حذف ${task.title}`}
                      className="rounded-lg p-1 text-slate-500 transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
