import { db } from '../db';
import { agentService } from './agentService';
import { WorkLog, Ticket, Task, Standup } from '../types';

export class StandupService {
  async generateStandup(date: string): Promise<Standup> {
    // 1. Get previous day's work logs
    // Note: In a real app, we might want to find the "last working day"
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    const workLogs = db.prepare('SELECT * FROM work_logs WHERE date = ?').all(prevDateStr) as WorkLog[];

    // 2. Get today's active tickets and tasks
    const activeTickets = db.prepare("SELECT * FROM tickets WHERE status NOT IN ('Done', 'Closed', 'Resolved')").all() as Ticket[];
    const activeTasks = db.prepare("SELECT * FROM tasks WHERE status NOT IN ('done')").all() as Task[];

    // 3. Construct prompt
    const yesterdaySummary = workLogs.length > 0 
      ? workLogs.map(log => `- ${log.description} (${log.duration_minutes}m)`).join('\n')
      : 'No work logs recorded.';

    const todaySummary = [
      ...activeTickets.map(t => `- [Jira] ${t.id}: ${t.summary} (${t.status})`),
      ...activeTasks.map(t => `- [Task] ${t.title} (${t.status})`)
    ].join('\n') || 'No active tasks or tickets.';

    const prompt = `
Yesterday I worked on:
${yesterdaySummary}

Today I plan to work on:
${todaySummary}

Please generate a concise standup update for me. Format it with "Yesterday", "Today", and "Blockers" sections.
    `;

    // 4. Call AI
    const content = await agentService.chat('planner', prompt);

    // 5. Save to DB
    const stmt = db.prepare(`
      INSERT INTO standups (date, content)
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET
        content = excluded.content,
        created_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(date, content);

    const result = this.getStandup(date);
    if (!result) {
      throw new Error('Failed to retrieve generated standup');
    }
    return result;
  }

  getStandup(date: string): Standup | null {
    const result = db.prepare('SELECT * FROM standups WHERE date = ?').get(date) as Standup | undefined;
    return result || null;
  }
}

export const standupService = new StandupService();
