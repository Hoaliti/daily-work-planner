export interface Plan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  source: 'manual' | 'jira';
  jiraKey?: string;
  jiraUrl?: string;
  estimate?: number;
  assignee?: string;
  createdAt: string;
  planId: string;
}

export interface WorkLog {
  id: string;
  date: string;
  taskId: string;
  description: string;
  hoursSpent: number;
}

export interface Standup {
  id: string;
  date: string;
  yesterdayWork: string;
  todayPlan: string;
  blockers: string;
  generatedContent: string;
}
