import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Globe, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { PingState, ProjectItem } from '../types/hub';
import { sanitizeUrl } from '../utils/security';

interface ProjectsShowcaseProps {
  projects: ProjectItem[];
}

export function ProjectsShowcase({ projects }: ProjectsShowcaseProps) {
  const [pings, setPings] = useState<Record<string, PingState>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const checkProjectPing = useCallback(async (project: ProjectItem) => {
    const safeUrl = sanitizeUrl(project.url);
    if (!safeUrl) {
      setPings((prev) => ({
        ...prev,
        [project.id]: { status: 'unreachable' },
      }));
      return;
    }

    setPings((prev) => ({
      ...prev,
      [project.id]: { ...prev[project.id], status: 'checking' },
    }));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    const start = performance.now();

    try {
      await fetch(safeUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setPings((prev) => ({
        ...prev,
        [project.id]: {
          status: 'online',
          latencyMs: elapsed,
          checkedAt: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      }));
    } catch {
      setPings((prev) => ({
        ...prev,
        [project.id]: {
          status: 'unreachable',
          checkedAt: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      }));
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  const checkAll = useCallback(() => {
    projects.forEach((p) => {
      void checkProjectPing(p);
    });
  }, [projects, checkProjectPing]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  return (
    <section id="projects" className="py-10 sm:py-14 border-t border-slate-800/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              معرض المشاريع الحية
            </h2>
            <p className="text-sm text-slate-400">
              تطبيقات منشورة تعمل فعلياً على بنية Cloudflare Workers مع فحص مباشر لحالة الاتصال.
            </p>
          </div>

          <button
            type="button"
            onClick={checkAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>فحص الحالة الآن</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-10 text-center">
            <Globe className="mx-auto mb-3 h-8 w-8 text-slate-500" aria-hidden="true" />
            <p className="text-base font-semibold text-slate-200">لا توجد مشاريع منشورة حالياً</p>
            <p className="mt-1 text-sm text-slate-400">
              يمكنك إضافة المشاريع من داخل مركز القيادة السري عبر تبويب إدارة المشاريع.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {projects.map((project) => {
              const safeHref = sanitizeUrl(project.url);
              const ping = pings[project.id] ?? { status: 'checking' };
              const showImage = Boolean(project.imageUrl) && !failedImages[project.id];

              return (
                <article
                  key={project.id}
                  className="liquid-glass liquid-glass-interactive flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6"
                >
                  <div>
                    <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-800/80 bg-[#070b18]">
                      {showImage ? (
                        <img
                          src={project.imageUrl}
                          alt={`${project.titleAr} — ${project.titleEn}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                          }
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0b1329] via-[#070b16] to-[#14102a] p-6 text-center">
                          <Globe className="h-8 w-8 text-cyan-400/80" aria-hidden="true" />
                          <span className="font-mono text-sm font-medium text-slate-200">
                            {project.titleEn}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 text-xs text-slate-400">
                        <span>{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300">{project.titleEn}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => void checkProjectPing(project)}
                        title="إعادة فحص الاتصال"
                        className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 py-0.5"
                      >
                        {ping.status === 'checking' && (
                          <>
                            <RefreshCw
                              className="h-3 w-3 animate-spin text-cyan-400"
                              aria-hidden="true"
                            />
                            <span className="text-slate-300">Checking...</span>
                          </>
                        )}
                        {ping.status === 'online' && (
                          <>
                            <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                            <span className="text-emerald-300">
                              Online {ping.latencyMs ? `· ${ping.latencyMs}ms` : ''}
                            </span>
                          </>
                        )}
                        {ping.status === 'unreachable' && (
                          <>
                            <WifiOff className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                            <span className="text-amber-300">Unreachable</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-50">{project.titleAr}</h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-slate-400">
                      {project.techStack.map((tech, idx) => (
                        <span key={`${project.id}-${tech}`} className="inline-flex items-center gap-2">
                          {idx > 0 && (
                            <span className="text-slate-600" aria-hidden="true">
                              ·
                            </span>
                          )}
                          <span>{tech}</span>
                        </span>
                      ))}
                    </div>

                    {safeHref ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-100 transition-all hover:border-cyan-300/70 hover:bg-cyan-400 hover:text-[#050811] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        <span>فتح التطبيق</span>
                        <span className="font-mono text-[11px] opacity-80">Open App</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-rose-400">رابط غير صالح</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
