import { useState } from 'react';
import { ArrowDownLeft, Code2, ExternalLink, Terminal } from 'lucide-react';
import { HERO_VISUAL_URL } from '../data/defaults';

export function HeroSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section id="top" className="relative pt-10 pb-14 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-between gap-8 lg:col-span-7">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-medium text-cyan-200 shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]">
                <span
                  className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                  aria-hidden="true"
                />
                <span>متاح للمشاريع التقنية</span>
                <span className="text-cyan-400/60" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-cyan-100">Available</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl [text-wrap:balance]">
                  Stark <span className="text-slate-500 font-normal">/</span>{' '}
                  <span className="bg-gradient-to-l from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent font-mono">
                    matrix12-dot
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  مطور تطبيقات ويب حديثة وأنظمة سحابية سريعة الاستجابة. أركز على بناء واجهات
                  عالية الدقة، تطبيقات تعمل على الحافة عبر{' '}
                  <span className="font-mono text-cyan-300">Cloudflare Workers</span>، وأدوات
                  تطوير عملية تجمع بين الأمان والأداء الصافي.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#050811] transition-all hover:bg-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span>استعراض المشاريع</span>
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://github.com/matrix12-dot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-violet-400/50 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <Code2 className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  <span className="font-mono">github.com/matrix12-dot</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div
              id="stack"
              className="liquid-glass rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                <Terminal className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>البيئة الأساسية</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-300">
                <span>React 19</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>TypeScript</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>Tailwind CSS</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>Cloudflare Workers</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="liquid-glass relative h-full min-h-[260px] overflow-hidden rounded-2xl p-2">
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#070b18]">
                {!imageError ? (
                  <img
                    src={HERO_VISUAL_URL}
                    alt="Stark Hub — هندسة الواجهات السحابية الداكنة"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover object-center lg:min-h-[340px]"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#081024] via-[#050811] to-[#120d26] p-8 text-center">
                    <Code2 className="h-10 w-10 text-cyan-400/80" aria-hidden="true" />
                    <p className="font-mono text-sm text-slate-300">Stark · matrix12-dot</p>
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050811]/85 via-transparent to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-xs text-slate-300">
                  <span className="font-semibold text-slate-100">مركز القيادة والبوابة</span>
                  <span className="font-mono text-cyan-300/90">Edge · Zero-Backend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
