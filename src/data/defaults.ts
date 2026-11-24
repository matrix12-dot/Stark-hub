import type { CodeSnippet, FocusStats, ProjectItem, TodoTask } from '../types/hub';

export const DEFAULT_PIN = '2026';

export const GITHUB_USERNAME = 'matrix12-dot';
export const GITHUB_REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
export const GITHUB_CACHE_TTL_MS = 10 * 60 * 1000;

export const STORAGE_KEYS = {
  PIN_HASH: 'stark_hub_pin_hash_v1',
  IS_CUSTOM_PIN: 'stark_hub_custom_pin_v1',
  PROJECTS: 'stark_hub_projects_v1',
  SNIPPETS: 'stark_hub_snippets_v1',
  QUICK_NOTE: 'stark_hub_quick_note_v1',
  TASKS: 'stark_hub_tasks_v1',
  FOCUS_STATS: 'stark_hub_focus_stats_v1',
  GITHUB_REPOS_CACHE: 'stark_hub_github_repos_cache_v1',
} as const;

export const HERO_VISUAL_URL = '/src/assets/images/hero_stark_horizon_1795545754011.jpg';

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'ofoq-aviation',
    titleAr: 'أفق للطيران',
    titleEn: 'Ofoq Aviation',
    description:
      'منصة رقمية حديثة لحلول الطيران والرحلات، مبنية بأداء فائق السرعة عبر الحوسبة السحابية الطرفية لتجربة تصفح سلسة وفورية.',
    url: 'https://flight-horizon.stark4.workers.dev',
    imageUrl: '/src/assets/images/project_ofoq_aviation_1795545753535.jpg',
    techStack: ['React', 'TypeScript', 'Tailwind', 'Cloudflare Workers'],
    category: 'Aviation & Cloud',
    status: 'live',
  },
  {
    id: 'qr-studio',
    titleAr: 'استوديو QR',
    titleEn: 'QR Studio',
    description:
      'أداة متطورة لإنشاء وتخصيص وتحويل رموز الاستجابة السريعة بجودة عالية ومعالجة فورية بالكامل من متصفح المستخدم.',
    url: 'https://qr-convert.qrconvert.workers.dev',
    imageUrl: '/src/assets/images/project_qr_studio_1795545755203.jpg',
    techStack: ['React', 'TypeScript', 'Tailwind', 'Cloudflare Workers'],
    category: 'Developer Utility',
    status: 'live',
  },
];

export const DEFAULT_SNIPPETS: CodeSnippet[] = [
  {
    id: 'cf-security-headers',
    title: 'ترويسات الأمان لـ Cloudflare Workers',
    category: 'Cloudflare',
    command: `export function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(res.body, { status: res.status, headers });
}`,
    notes: 'تضاف قبل إرجاع الاستجابة لتعزيز حماية التطبيقات المستضافة على الحافة.',
    createdAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 'git-clean-sync',
    title: 'تنظيف الفروع المحلية ومزامنة Git',
    category: 'Git',
    command: `git fetch --prune && git pull --rebase origin main && git status -sb`,
    notes: 'تحديث الفرع الرئيسي بأمان مع حذف مراجع الفروع المحذوفة.',
    createdAt: '2026-11-21T12:30:00.000Z',
  },
  {
    id: 'nmap-quick-audit',
    title: 'فحص المنافذ والخدمات النشطة (Nmap)',
    category: 'Nmap',
    command: `nmap -sV -sC -T4 --open -oN scan_report.txt target.example.com`,
    notes: 'فحص سريع للمنافذ المفتوحة وإصدارات الخدمات مع حفظ التقرير.',
    createdAt: '2026-11-22T09:15:00.000Z',
  },
  {
    id: 'termux-dev-bootstrap',
    title: 'تحديث حزم Termux وتجهيز بيئة التطوير',
    category: 'Termux',
    command: `pkg update && pkg upgrade -y && pkg install -y git nodejs-lts python openssh`,
    notes: 'تهيئة سريعة لأهم أدوات التطوير والاتصال الآمن.',
    createdAt: '2026-11-22T18:45:00.000Z',
  },
  {
    id: 'python-http-server',
    title: 'خادم ملفات محلي سريع عبر Python',
    category: 'Python',
    command: `python3 -m http.server 8080 --bind 127.0.0.1`,
    notes: 'مقيد على العنوان المحلي 127.0.0.1 لأقصى درجات الأمان أثناء الاختبار.',
    createdAt: '2026-11-23T14:00:00.000Z',
  },
];

export const DEFAULT_QUICK_NOTE = `أفكار سريعة ومسودة أوامر:
- مراجعة إعدادات Cloudflare Pages وربط النطاق المخصص.
- تحسين زمن الاستجابة الأولي ومراقبة حالة المشاريع الحية.
- توثيق أوامر الشبكات والفحص في مخزن الأكواد.`;

export const DEFAULT_TASKS: TodoTask[] = [
  {
    id: 'task-1',
    title: 'مراجعة ترويسات الأمان CSP لتطبيق أفق للطيران',
    priority: 'high',
    completed: false,
    createdAt: '2026-11-24T08:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'تحديث وثائق التصدير في استوديو QR',
    priority: 'medium',
    completed: false,
    createdAt: '2026-11-24T09:00:00.000Z',
  },
  {
    id: 'task-3',
    title: 'أخذ نسخة احتياطية JSON لبيانات مركز القيادة',
    priority: 'low',
    completed: true,
    createdAt: '2026-11-23T20:00:00.000Z',
  },
];

export const DEFAULT_FOCUS_STATS: FocusStats = {
  completedSessions: 0,
  totalFocusMinutes: 0,
};
