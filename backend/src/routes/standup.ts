import { Router, Request, Response } from 'express';
import { standupService } from '../services/standupService';
import { glmService } from '../services/glmService';
import { db } from '../db';

const router = Router();

// POST /api/standup/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const standup = await standupService.generateStandup(date);
    res.json(standup);
  } catch (error: unknown) {
    console.error('Error generating standup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate standup';
    res.status(500).json({ error: errorMessage });
  }
});

// POST /api/standup/generate-interactive - New interactive endpoint
router.post('/generate-interactive', async (req: Request, res: Response) => {
  try {
    const { planId, yesterdayWork, todayForecast, blockers, todayTasks } = req.body;

    // Build prompt for GLM
    const prompt = `Generate a daily standup update for me based on the following information.

**Yesterday's work:**
${yesterdayWork || 'No specific tasks reported'}

**Today's plan:**
${todayForecast || 'No specific plan reported'}

**Blockers:**
${blockers || 'No blockers reported'}

**Today's scheduled tasks:**
${todayTasks && todayTasks.length > 0 
  ? todayTasks.map((t: { title: string; status: string; priority: string }, i: number) => 
      `${i + 1}. ${t.title} (${t.status}, ${t.priority})`
    ).join('\n')
  : 'No tasks scheduled'}

Please generate a clear, professional standup update in the following format:

**Yesterday:**
- [bullet points of what was done]

**Today:**
- [bullet points of today's focus]

**Blockers:**
- [any blockers or "None"]

Keep it concise and suitable for a standup meeting. Use professional language.`;

    const response = await glmService.chat(
      [{ role: 'user', content: prompt }],
      'glm-5'
    );

    // Save to database
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT OR REPLACE INTO standups (date, content, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(today, response);

    res.json({ standup: response });
  } catch (error: unknown) {
    console.error('Error generating interactive standup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate standup';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/standup/:date
router.get('/:date', (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const standup = standupService.getStandup(date);
    
    if (!standup) {
      return res.status(404).json({ error: 'Standup not found for this date' });
    }
    
    res.json(standup);
  } catch (error: unknown) {
    console.error('Error fetching standup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch standup';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
