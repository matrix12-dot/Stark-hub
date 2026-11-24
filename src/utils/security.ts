import type {
  CodeSnippet,
  FocusStats,
  ProjectItem,
  TaskPriority,
  TodoTask,
  VaultBackupPayload,
} from '../types/hub';

/**
 * Computes a lowercase hex SHA-256 hash using the Web Crypto API.
 */
export async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Strips null bytes, control characters, and raw HTML angle brackets from user-supplied text
 * to guarantee safe rendering and prevent XSS across imports and storage.
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes multi-line code snippets while preserving newlines, tabs, and shell angle brackets
 * safely (React renders strings as text nodes, never raw HTML). Removes only ASCII control chars.
 */
export function sanitizeCommandText(input: unknown, maxLength = 8000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and normalizes URLs, allowing strictly http: and https: schemes
 * to block javascript:, data:, or vbscript: XSS vectors.
 */
export function sanitizeUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates relative local asset paths (e.g. /src/assets/images/...) or https/http URLs.
 */
export function sanitizeImageSrc(rawSrc: unknown): string | undefined {
  if (typeof rawSrc !== 'string') return undefined;
  const trimmed = rawSrc.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/src/assets/images/') && !trimmed.includes('..')) {
    return trimmed;
  }
  return sanitizeUrl(trimmed) ?? undefined;
}

const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const VALID_STATUSES: ProjectItem['status'][] = ['live', 'beta', 'maintenance'];

export function validateBackupPayload(raw: unknown): VaultBackupPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.projects) || !Array.isArray(obj.snippets) || !Array.isArray(obj.tasks)) {
    return null;
  }

  const projects: ProjectItem[] = [];
  for (const item of obj.projects) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    const safeUrl = sanitizeUrl(p.url);
    const titleAr = sanitizeText(p.titleAr, 120);
    if (!safeUrl || !titleAr) continue;

    const status = VALID_STATUSES.includes(p.status as ProjectItem['status'])
      ? (p.status as ProjectItem['status'])
      : 'live';

    const techStack = Array.isArray(p.techStack)
      ? p.techStack
          .map((t) => sanitizeText(t, 40))
          .filter(Boolean)
          .slice(0, 10)
      : [];

    projects.push({
      id: sanitizeText(p.id, 64) || crypto.randomUUID(),
      titleAr,
      titleEn: sanitizeText(p.titleEn, 120) || titleAr,
      description: sanitizeText(p.description, 400),
      url: safeUrl,
      imageUrl: sanitizeImageSrc(p.imageUrl),
      techStack,
      category: sanitizeText(p.category, 60) || 'Web App',
      status,
    });
  }

  const snippets: CodeSnippet[] = [];
  for (const item of obj.snippets) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    const title = sanitizeText(s.title, 140);
    const command = sanitizeCommandText(s.command, 6000);
    if (!title || !command) continue;

    snippets.push({
      id: sanitizeText(s.id, 64) || crypto.randomUUID(),
      title,
      category: sanitizeText(s.category, 40) || 'General',
      command,
      notes: sanitizeText(s.notes, 300) || undefined,
      createdAt: sanitizeText(s.createdAt, 40) || new Date().toISOString(),
    });
  }

  const tasks: TodoTask[] = [];
  for (const item of obj.tasks) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    const title = sanitizeText(t.title, 200);
    if (!title) continue;

    const priority = VALID_PRIORITIES.includes(t.priority as TaskPriority)
      ? (t.priority as TaskPriority)
      : 'medium';

    tasks.push({
      id: sanitizeText(t.id, 64) || crypto.randomUUID(),
      title,
      priority,
      completed: Boolean(t.completed),
      createdAt: sanitizeText(t.createdAt, 40) || new Date().toISOString(),
    });
  }

  const rawFocus = (obj.focusStats && typeof obj.focusStats === 'object'
    ? obj.focusStats
    : {}) as Record<string, unknown>;

  const focusStats: FocusStats = {
    completedSessions:
      typeof rawFocus.completedSessions === 'number' && Number.isFinite(rawFocus.completedSessions)
        ? Math.max(0, Math.floor(rawFocus.completedSessions))
        : 0,
    totalFocusMinutes:
      typeof rawFocus.totalFocusMinutes === 'number' && Number.isFinite(rawFocus.totalFocusMinutes)
        ? Math.max(0, Math.floor(rawFocus.totalFocusMinutes))
        : 0,
    lastSessionDate: sanitizeText(rawFocus.lastSessionDate, 40) || undefined,
  };

  return {
    version: typeof obj.version === 'number' ? obj.version : 1,
    exportedAt: sanitizeText(obj.exportedAt, 40) || new Date().toISOString(),
    projects,
    snippets,
    quickNote: sanitizeCommandText(obj.quickNote, 15000),
    tasks,
    focusStats,
  };
}
