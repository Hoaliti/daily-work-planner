import { Router, Request, Response } from 'express';
import { opencodeService } from '../services/opencodeService';

const router = Router();

// Recommend today's tasks based on all tasks
router.post('/recommend-today', async (req: Request, res: Response) => {
  try {
    const { planId, tasks } = req.body;
    
    // Build prompt
    const prompt = `I have the following tasks in my plan. Please recommend which ones I should focus on today based on priority, dependencies, and urgency.

Tasks:
${tasks.map((t: { id: string; title: string; priority: string; status: string; estimate?: number }, i: number) => 
  `${i + 1}. [${t.priority}] ${t.title} (${t.status})${t.estimate ? ` - ${t.estimate}pts` : ''}`
).join('\n')}

Please provide:
1. Top 3 tasks to focus on today (in order of priority)
2. Brief explanation for each recommendation
3. Any dependencies or blockers to consider`;

    const result = await opencodeService.chat(prompt, 'planner', true);

    res.json({ recommendation: result.response });
  } catch (error) {
    console.error('Failed to get recommendation:', error);
    res.status(500).json({ error: 'Failed to get recommendation' });
  }
});

// Get guidance on how to do a specific task
router.post('/task-guidance', async (req: Request, res: Response) => {
  try {
    const { task } = req.body;
    
    const prompt = `I need to work on this task. Please provide a step-by-step guide on how to approach it.

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
${task.jiraKey ? `Jira: ${task.jiraKey}` : ''}

Please provide:
1. Prerequisites (what I need before starting)
2. Step-by-step approach
3. Potential challenges or gotchas
4. Estimated time if possible`;

    const result = await opencodeService.chat(prompt, 'planner', true);

    res.json({ guidance: result.response });
  } catch (error) {
    console.error('Failed to get task guidance:', error);
    res.status(500).json({ error: 'Failed to get task guidance' });
  }
});

export default router;
