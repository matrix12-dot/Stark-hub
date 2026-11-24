export type TaskPriority = 'high' | 'medium' | 'low';

export interface ProjectItem {
  id: string;
  titleAr: string;
  titleEn: string;
  description: string;
  url: string;
  imageUrl?: string;
  techStack: string[];
  category: string;
  status: 'live' | 'beta' | 'maintenance';
}

export interface CodeSnippet {
  id: string;
  title: string;
  category: string;
  command: string;
  notes?: string;
  createdAt: string;
}

export interface TodoTask {
  id: string;
  title: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
}

export interface FocusStats {
  completedSessions: number;
  totalFocusMinutes: number;
  lastSessionDate?: string;
}

export type VaultTabId = 'snippets' | 'notes' | 'focus' | 'portfolio';

export interface VaultBackupPayload {
  version: number;
  exportedAt: string;
  projects: ProjectItem[];
  snippets: CodeSnippet[];
  quickNote: string;
  tasks: TodoTask[];
  focusStats: FocusStats;
}

export interface PingState {
  status: 'checking' | 'online' | 'unreachable';
  latencyMs?: number;
  checkedAt?: string;
}
