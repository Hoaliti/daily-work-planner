export type SprintStatus = 'active' | 'completed' | 'planned';

export interface Sprint {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
}

export interface Ticket {
  id: string; // Jira Key
  summary: string;
  status: string;
  priority: string | null;
  sprint_id: number | null;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface Task {
  id: string; // UUID
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  id: number;
  date: string;
  duration_minutes: number;
  description: string;
  ticket_id: string | null;
  task_id: string | null;
  created_at: string;
}

export interface Standup {
  id: number;
  date: string;
  content: string;
  created_at: string;
}
