import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { DEFAULT_PROJECTS } from '../../data/defaults';
import type { ProjectItem } from '../../types/hub';
import { sanitizeImageSrc, sanitizeText, sanitizeUrl } from '../../utils/security';

interface PortfolioManagerTabProps {
  projects: ProjectItem[];
  onChange: (next: ProjectItem[]) => void;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

export function PortfolioManagerTab({
  projects,
  onChange,
  onNotify,
}: PortfolioManagerTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Web App');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('React, TypeScript, Tailwind, Cloudflare');
  const [imageUrl, setImageUrl] = useState('');

  const openAdd = () => {
    setEditingId(null);
    setTitleAr('');
    setTitleEn('');
    setUrl('https://');
    setCategory('Cloud App');
    setDescription('');
    setTechInput('React, TypeScript, Tailwind, Cloudflare Workers');
    setImageUrl('');
    setIsFormOpen(true);
  };

  const openEdit = (p: ProjectItem) => {
    setEditingId(p.id);
    setTitleAr(p.titleAr);
    setTitleEn(p.titleEn);
    setUrl(p.url);
    setCategory(p.category);
    setDescription(p.description);
    setTechInput(p.techStack.join(', '));
    setImageUrl(p.imageUrl ?? '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitleAr = sanitizeText(titleAr, 120);
    const safeTitleEn = sanitizeText(titleEn, 120) || safeTitleAr;
    const safeUrl = sanitizeUrl(url);
    const safeDesc = sanitizeText(description, 400);
    const safeCat = sanitizeText(category, 60) || 'Web App';
    const safeImg = sanitizeImageSrc(imageUrl);

    if (!safeTitleAr || !safeUrl) {
      onNotify('يرجى إدخال اسم المشروع ورابط صحيح يبدأ بـ https:// أو http://.', 'error');
      return;
    }

    const techStack = techInput
      .split(',')
      .map((t) => sanitizeText(t, 40))
      .filter(Boolean)
      .slice(0, 8);

    if (editingId) {
      onChange(
        projects.map((p) =>
          p.id === editingId
            ? {
                ...p,
                titleAr: safeTitleAr,
                titleEn: safeTitleEn,
                url: safeUrl,
                category: safeCat,
                description: safeDesc,
                techStack,
                imageUrl: safeImg,
              }
            : p
        )
      );
      onNotify('تم تحديث بيانات المشروع في الواجهة العامة.');
    } else {
      const nextProject: ProjectItem = {
        id: crypto.randomUUID(),
        titleAr: safeTitleAr,
        titleEn: safeTitleEn,
        url: safeUrl,
        category: safeCat,
        description: safeDesc,
        techStack,
        imageUrl: safeImg,
        status: 'live',
      };
      onChange([...projects, nextProject]);
      onNotify('تمت إضافة المشروع ونشره على الواجهة العامة.');
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const moveProject = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const copy = [...projects];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  };

  const deleteProject = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
    onNotify('تمت إزالة المشروع.');
  };

  const resetDefaults = () => {
    onChange(DEFAULT_PROJECTS);
    onNotify('تمت استعادة المشاريع الافتراضية.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          أي تعديل أو إضافة هنا ينعكس فوراً في معرض المشاريع بالواجهة العامة.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-[#050811] hover:bg-cyan-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Project · إضافة مشروع</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-cyan-400/25 bg-[#060a16]/90 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              {editingId ? 'تعديل المشروع' : 'إضافة مشروع جديد إلى المعرض'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="إغلاق"
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-title-ar" className="mb-1.5 block text-xs text-slate-300">
                اسم المشروع (بالعربية)
              </label>
              <input
                id="proj-title-ar"
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                required
                placeholder="مثال: أفق للطيران"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="proj-title-en" className="mb-1.5 block text-xs text-slate-300">
                الاسم الإنجليزي
              </label>
              <input
                id="proj-title-en"
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                dir="ltr"
                placeholder="Ofoq Aviation"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="proj-url" className="mb-1.5 block text-xs text-slate-300">
                رابط التطبيق (HTTPS)
              </label>
              <input
                id="proj-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                dir="ltr"
                required
                placeholder="https://example.workers.dev"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="proj-category" className="mb-1.5 block text-xs text-slate-300">
                التصنيف
              </label>
              <input
                id="proj-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Developer Utility"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="proj-desc" className="mb-1.5 block text-xs text-slate-300">
              وصف مختصر
            </label>
            <textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف موجز للمشروع والتقنيات المستخدمة..."
              className="w-full rounded-xl border border-slate-700/80 bg-[#040710] p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-tech" className="mb-1.5 block text-xs text-slate-300">
                التقنيات (مفصولة بفاصلة ,)
              </label>
              <input
                id="proj-tech"
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="proj-img" className="mb-1.5 block text-xs text-slate-300">
                رابط صورة الغلاف (اختياري)
              </label>
              <input
                id="proj-img"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                dir="ltr"
                placeholder="https://... (أو اتركه فارغاً للتصميم التلقائي)"
                className="w-full rounded-xl border border-slate-700/80 bg-[#040710] px-3.5 py-2 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>
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
              {editingId ? 'حفظ التعديلات' : 'نشر المشروع'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/85 bg-[#060a16]/75 p-4"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="text-sm font-bold text-slate-100">{project.titleAr}</h4>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-xs text-cyan-300">{project.titleEn}</span>
              </div>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-flex items-center gap-1 font-mono text-xs text-slate-400 hover:text-cyan-300 truncate max-w-full"
              >
                <span className="truncate">{project.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => moveProject(index, -1)}
                disabled={index === 0}
                aria-label="تحريك للأعلى"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-slate-600 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveProject(index, 1)}
                disabled={index === projects.length - 1}
                aria-label="تحريك للأسفل"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-slate-600 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => openEdit(project)}
                aria-label={`تعديل ${project.titleAr}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => deleteProject(project.id)}
                aria-label={`حذف ${project.titleAr}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
