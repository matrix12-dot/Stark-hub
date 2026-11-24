import { ExternalLink } from 'lucide-react';

interface NavbarProps {
  isVaultUnlocked: boolean;
}

export function Navbar({ isVaultUnlocked }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#050811]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-50 transition-colors hover:text-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1"
        >
          Stark Hub
        </a>

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          <a
            href="#top"
            className="transition-colors hover:text-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 py-0.5"
          >
            الرئيسية
          </a>
          <a
            href="#projects"
            className="transition-colors hover:text-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 py-0.5"
          >
            المشاريع الحية
          </a>
          <a
            href="#stack"
            className="transition-colors hover:text-cyan-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 py-0.5"
          >
            البيئة التقنية
          </a>
          {isVaultUnlocked && (
            <a
              href="#command-center"
              className="text-cyan-300 transition-colors hover:text-cyan-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1 py-0.5"
            >
              مركز القيادة
            </a>
          )}
        </nav>

        <div className="flex items-center shrink-0">
          <a
            href="https://github.com/matrix12-dot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-300/60 hover:bg-cyan-500/20 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span className="font-mono">GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
