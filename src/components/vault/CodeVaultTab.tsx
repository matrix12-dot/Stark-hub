import { useMemo, useState } from 'react';
import { Check, Copy, Pencil, Plus, Search, Terminal, Trash2, X } from 'lucide-react';
import type { CodeSnippet } from '../../types/hub';
import { sanitizeCommandText, sanitizeText } from '../../utils/security';

interface CodeVaultTabProps {
  snippets: CodeSnippet[];
  onChange: (next: CodeSnippet[]) => void;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

const PRESET_CATEGORIES = ['Git', 'Termux', 'Nmap', 'Python', 'Cloudflare', 'Docker'];

export function CodeVaultTab({ snippets, onChange, onNotify }: CodeVaultTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Git');
  const [command, setCommand] = useState('');
  const [notes, setNotes] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>(snippets.map((s) => s.category));
    return ['الكل', ...Array.from(set)];
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snippets.filter((s) => {
      const matchesCat = selectedCategory === 'الكل' || s.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q) ||
        (s.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [snippets, search, selectedCategory]);

  const openNewForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Git');
    setCommand('');
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditForm = (snippet: CodeSnippet) => {
    setEditingId(snippet.id);
    setTitle(snippet.title);
    setCategory(snippet.category);
    setCommand(snippet.command);
    setNotes(snippet.notes ?? '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = sanitizeText(title, 140);
    const safeCategory = sanitizeText(category, 40) || 'General';
    const safeCommand = sanitizeCommandText(command, 6000);
    const safeNotes = sanitizeText(notes, 300);

    if (!safeTitle || !safeCommand) {
      onNotify('يرجى إدخال العنوان والأمر البرمجي.', 'error');
      return;
    }

    if (editingId) {
      onChange(
        snippets.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: safeTitle,
                category: safeCategory,
                command: safeCommand,
                notes: safeNotes || undefined,
              }
            : item
        )
      );
      onNotify('تم تحديث الأمر بنجاح.');
    } else {
      const nextItem: CodeSnippet = {
        id: crypto.randomUUID(),
        title: safeTitle,
        category: safeCategory,
        command: safeCommand,
        notes: safeNotes || undefined,
        createdAt: new Date().toISOString(),
      };
      onChange([nextItem, ...snippets]);
      onNotify('تم حفظ الأمر في الخزنة.');
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onChange(snippets.filter((item) => item.id !== id));
    onNotify('تم حذف الأمر.');
  };

  const handleCopy = async (snippet: CodeSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.command);
      setCopiedId(snippet.id);
      onNotify('تم نسخ الأمر إلى الحافظة.');
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === snippet.id ? null : prev));
      }, 1800);
    } catch {
      onNotify('تعذر النسخ التلقائي — يرجى النسخ يدوياً.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الأوامر والأكواد أو الوسوم..."
            className="w-full rounded-xl border border-slate-700/80 bg-[#040710]/90 py-2.5 pr-10 pl-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
          />
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-[#050811] transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>إضافة أمر جديد</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-cyan-400/25 bg-[#060a16]/90 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              {editingId ? 'تعديل الأمر المحفوظ' : 'إضافة أمر أو كود جديد'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="إغلاق النموذج"
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="snippet-title" className="mb-1.5 block text-xs text-slate-300">
                العنوان
              </label>
              <input
                id="snippet-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: فحص المنافذ عبر Nmap"
                required
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="snippet-category" className="mb-1.5 block text-xs text-slate-300">
                التصنيف
              </label>
              <input
                id="snippet-category"
                list="snippet-category-presets"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Git / Termux / Nmap / Python / Cloudflare"
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
              <datalist id="snippet-category-presets">
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor="snippet-command" className="mb-1.5 block text-xs text-slate-300">
              الكود أو الأمر البرمجي
            </label>
            <textarea
              id="snippet-command"
              rows={4}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              dir="ltr"
              placeholder="nmap -sV -T4 target.example.com"
              required
              className="w-full rounded-xl border border-slate-700/80 bg-[#03050c] p-3.5 font-mono text-xs leading-relaxed text-cyan-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="snippet-notes" className="mb-1.5 block text-xs text-slate-300">
              ملاحظة مختصرة (اختياري)
            </label>
            <input
              id="snippet-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="متى أو كيف يستخدم هذا الأمر..."
              className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-[#050811] hover:bg-cyan-300"
            >
              {editingId ? 'حفظ التعديلات' : 'حفظ الأمر'}
            </button>
          </div>
        </form>
      )}

      {filteredSnippets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-[#060a16]/60 p-10 text-center">
          <Terminal className="mx-auto mb-3 h-7 w-7 text-slate-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-200">لا توجد أوامر مطابقة</p>
          <p className="mt-1 text-xs text-slate-400">
            جرّب تغيير كلمة البحث أو أضف أمراً جديداً إلى مخزن الأكواد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSnippets.map((snippet) => {
            const isCopied = copiedId === snippet.id;
            return (
              <div
                key={snippet.id}
                className="rounded-2xl border border-slate-800/85 bg-[#060a16]/75 p-4 sm:p-5 transition-colors hover:border-slate-700"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h3 className="text-sm font-bold text-slate-100">{snippet.title}</h3>
                    <span className="text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono text-xs text-cyan-300">{snippet.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleCopy(snippet)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          <span className="text-emerald-300">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(snippet)}
                      aria-label={`تعديل ${snippet.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-100"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(snippet.id)}
                      aria-label={`حذف ${snippet.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#03050c] p-3.5 font-mono text-xs leading-relaxed text-cyan-100/95"
                >
                  <code>{snippet.command}</code>
                </pre>

                {snippet.notes && (
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{snippet.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
