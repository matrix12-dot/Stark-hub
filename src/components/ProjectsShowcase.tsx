import { useCallback, useEffect, useState } from 'react';
import {
  Braces,
  Code2,
  Cpu,
  ExternalLink,
  FileCode2,
  GitFork,
  Globe,
  RefreshCw,
  Star,
  Terminal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  GITHUB_CACHE_TTL_MS,
  GITHUB_REPOS_API_URL,
  GITHUB_USERNAME,
  STORAGE_KEYS,
} from '../data/defaults';
import type {
  GitHubCachePayload,
  GitHubRepoItem,
  PingState,
  ProjectItem,
} from '../types/hub';
import { sanitizeGitHubRepos, sanitizeUrl } from '../utils/security';

interface ProjectsShowcaseProps {
  projects: ProjectItem[];
}

function readCachedRepos(): { payload: GitHubCachePayload | null; isFresh: boolean } {
  if (typeof window === 'undefined') return { payload: null, isFresh: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.GITHUB_REPOS_CACHE);
    if (!raw) return { payload: null, isFresh: false };
    const parsed = JSON.parse(raw) as Partial<GitHubCachePayload>;
    if (typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.repos)) {
      return { payload: null, isFresh: false };
    }
    const sanitized = sanitizeGitHubRepos(parsed.repos);
    const isFresh = Date.now() - parsed.fetchedAt < GITHUB_CACHE_TTL_MS;
    return {
      payload: { fetchedAt: parsed.fetchedAt, repos: sanitized },
      isFresh,
    };
  } catch {
    return { payload: null, isFresh: false };
  }
}

function writeCachedRepos(payload: GitHubCachePayload): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.GITHUB_REPOS_CACHE, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

function getLanguageFallbackMeta(language: string | null) {
  const normalized = (language ?? '').toLowerCase();
  if (normalized === 'typescript' || normalized === 'javascript') {
    return {
      Icon: Braces,
      glowClass: 'from-[#071529] via-[#060a16] to-[#130d2b]',
      iconClass: 'text-cyan-300',
    };
  }
  if (normalized === 'python' || normalized === 'rust' || normalized === 'go') {
    return {
      Icon: Cpu,
      glowClass: 'from-[#0b1726] via-[#060a16] to-[#1a1030]',
      iconClass: 'text-violet-300',
    };
  }
  if (normalized === 'shell' || normalized === 'bash' || normalized === 'powershell') {
    return {
      Icon: Terminal,
      glowClass: 'from-[#071922] via-[#060a16] to-[#0d1428]',
      iconClass: 'text-emerald-300',
    };
  }
  if (normalized === 'html' || normalized === 'css') {
    return {
      Icon: FileCode2,
      glowClass: 'from-[#0c1428] via-[#060a16] to-[#1b0f2a]',
      iconClass: 'text-sky-300',
    };
  }
  return {
    Icon: Code2,
    glowClass: 'from-[#0b1329] via-[#070b16] to-[#14102a]',
    iconClass: 'text-cyan-300',
  };
}

export function ProjectsShowcase({ projects }: ProjectsShowcaseProps) {
  const [pings, setPings] = useState<Record<string, PingState>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [failedRepoCovers, setFailedRepoCovers] = useState<Record<number, boolean>>({});

  const [repos, setRepos] = useState<GitHubRepoItem[]>(() => {
    const { payload } = readCachedRepos();
    return payload?.repos ?? [];
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const { payload } = readCachedRepos();
    return payload?.fetchedAt ?? null;
  });
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(() => {
    const { isFresh, payload } = readCachedRepos();
    return !isFresh || !payload;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

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

  const fetchGitHubRepos = useCallback(async (forceRefresh = false) => {
    const { payload, isFresh } = readCachedRepos();
    if (!forceRefresh && isFresh && payload) {
      setRepos(payload.repos);
      setLastSyncedAt(payload.fetchedAt);
      setIsLoadingRepos(false);
      setRepoError(null);
      return;
    }

    if (forceRefresh) {
      setIsSyncing(true);
    } else if (!payload) {
      setIsLoadingRepos(true);
    } else {
      setIsSyncing(true);
    }
    setRepoError(null);

    try {
      const response = await fetch(GITHUB_REPOS_API_URL, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'تم تجاوز حد طلبات GitHub API مؤقتاً.'
            : `تعذر الجلب من GitHub (${response.status})`
        );
      }

      const rawData: unknown = await response.json();
      const sanitized = sanitizeGitHubRepos(rawData);
      const nextCache: GitHubCachePayload = {
        fetchedAt: Date.now(),
        repos: sanitized,
      };
      writeCachedRepos(nextCache);
      setRepos(sanitized);
      setLastSyncedAt(nextCache.fetchedAt);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تعذر الاتصال بخدمة GitHub حالياً.';
      setRepoError(message);
    } finally {
      setIsLoadingRepos(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    void fetchGitHubRepos(false);
  }, [fetchGitHubRepos]);

  const formattedSyncTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section id="projects" className="py-10 sm:py-14 border-t border-slate-800/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
        {/* Featured Live Apps */}
        <div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                معرض المشاريع الحية
              </h2>
              <p className="text-sm text-slate-400">
                المشاريع المميزة المنشورة على Cloudflare Workers إلى جانب مستودعات GitHub العامة.
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
              <p className="text-base font-semibold text-slate-200">لا توجد مشاريع مميزة حالياً</p>
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
                    className="liquid-glass liquid-glass-interactive group flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 border-cyan-400/20"
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
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0b1329] via-[#070b16] to-[#14102a] p-6 text-center transition-transform duration-300 group-hover:scale-[1.02]">
                            <Globe className="h-8 w-8 text-cyan-400/80" aria-hidden="true" />
                            <span className="font-mono text-sm font-medium text-slate-200">
                              {project.titleEn}
                            </span>
                          </div>
                        )}

                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050811]/75 via-transparent to-transparent"
                          aria-hidden="true"
                        />

                        <span className="absolute top-3 right-3 rounded-lg border border-cyan-300/40 bg-[#050811]/85 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-cyan-200 backdrop-blur-md">
                          Featured
                        </span>
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
                          <span
                            key={`${project.id}-${tech}`}
                            className="inline-flex items-center gap-2"
                          >
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

        {/* Public GitHub Repositories Feed */}
        <div className="border-t border-slate-800/60 pt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h3 className="text-xl font-bold text-slate-100">مستودعات GitHub العامة</h3>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-xs text-cyan-300 tabular-nums">
                  {repos.length} Repositories
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مزامنة تلقائية من حساب{' '}
                <span className="font-mono text-slate-300">matrix12-dot</span> مع تخزين مؤقت لمدة 10 دقائق
                {formattedSyncTime ? ` · آخر تحديث ${formattedSyncTime}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchGitHubRepos(true)}
              disabled={isSyncing || isLoadingRepos}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-55 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing || isLoadingRepos ? 'animate-spin text-cyan-300' : ''}`}
                aria-hidden="true"
              />
              <span>تحديث من GitHub</span>
            </button>
          </div>

          {repoError && (
            <div
              role="status"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-xs text-amber-200"
            >
              <span>
                {repoError}
                {repos.length > 0 ? ' (يتم عرض آخر نسخة مخزنة محلياً)' : ''}
              </span>
              <button
                type="button"
                onClick={() => void fetchGitHubRepos(true)}
                className="font-semibold text-amber-100 underline underline-offset-4 hover:text-white"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {isLoadingRepos ? (
            <div
              aria-label="جاري تحميل المستودعات"
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              {[1, 2].map((slot) => (
                <div
                  key={slot}
                  className="liquid-glass animate-pulse rounded-2xl p-5 sm:p-6 space-y-5"
                >
                  <div className="aspect-[16/9] w-full rounded-xl bg-slate-800/70" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-5 w-44 rounded bg-slate-800/90" />
                    <div className="h-3.5 w-20 rounded bg-slate-800/70" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-full rounded bg-slate-800/70" />
                    <div className="h-3.5 w-4/5 rounded bg-slate-800/70" />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/70 pt-4">
                    <div className="h-3.5 w-28 rounded bg-slate-800/70" />
                    <div className="h-9 w-32 rounded-xl bg-slate-800/80" />
                  </div>
                </div>
              ))}
            </div>
          ) : repos.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-8 text-center">
              <Code2 className="mx-auto mb-2.5 h-7 w-7 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-200">
                لا توجد مستودعات عامة إضافية للعرض حالياً
              </p>
              <p className="mt-1 text-xs text-slate-400">
                يمكنك الضغط على «تحديث من GitHub» لإعادة المزامنة في أي وقت.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {repos.map((repo) => {
                const ogCoverUrl = `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${encodeURIComponent(repo.name)}`;
                const showFallbackCover = Boolean(failedRepoCovers[repo.id]);
                const fallbackMeta = getLanguageFallbackMeta(repo.language);
                const LangIcon = fallbackMeta.Icon;

                return (
                  <article
                    key={repo.id}
                    className="liquid-glass liquid-glass-interactive group flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6"
                  >
                    <div>
                      <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-800/80 bg-[#070b18]">
                        {!showFallbackCover ? (
                          <img
                            src={ogCoverUrl}
                            alt={`${repo.name} — GitHub Repository Preview`}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedRepoCovers((prev) => ({ ...prev, [repo.id]: true }))
                            }
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br ${fallbackMeta.glowClass} p-6 text-center transition-transform duration-300 group-hover:scale-[1.02]`}
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                              <LangIcon
                                className={`h-6 w-6 ${fallbackMeta.iconClass}`}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="space-y-1">
                              <span
                                dir="ltr"
                                className="block font-mono text-sm font-bold text-slate-100"
                              >
                                {repo.name}
                              </span>
                              {repo.language && (
                                <span className="block font-mono text-xs text-slate-400">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050811]/90 via-[#050811]/25 to-[#050811]/10"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2 text-xs text-slate-400">
                          <span className="font-mono text-slate-300">
                            {repo.language ?? 'Repository'}
                          </span>
                          {repo.fork && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Fork</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 tabular-nums">
                          <span className="inline-flex items-center gap-1" title="Stars">
                            <Star className="h-3.5 w-3.5 text-amber-300/90" aria-hidden="true" />
                            <span>{repo.stargazersCount}</span>
                          </span>
                          <span className="text-slate-700" aria-hidden="true">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1" title="Forks">
                            <GitFork className="h-3.5 w-3.5 text-violet-300/90" aria-hidden="true" />
                            <span>{repo.forksCount}</span>
                          </span>
                        </div>
                      </div>

                      <h4
                        dir="ltr"
                        className="truncate text-right font-mono text-xl font-bold text-slate-50"
                        title={repo.name}
                      >
                        {repo.name}
                      </h4>

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">
                        {repo.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                      <span className="font-mono text-xs text-slate-400">
                        {repo.language ? `${repo.language} · GitHub` : 'Open Source · GitHub'}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 font-mono text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>GitHub Code</span>
                        </a>

                        {repo.homepageUrl && (
                          <a
                            href={repo.homepageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3.5 py-2 font-mono text-xs font-bold text-cyan-100 transition-colors hover:border-cyan-300/70 hover:bg-cyan-400 hover:text-[#050811] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                          >
                            <span>Live Demo</span>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
