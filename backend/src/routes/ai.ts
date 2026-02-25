import { Router, Request, Response } from 'express';
import { glmService } from '../services/glmService';

const router = Router();

/**
 * POST /api/ai/chat
 * Body: { message: string, model?: string }
 */
router.post('/chat', async (req: Request, res: Response) => {
  const { message, model } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await glmService.chat(
      [{ role: 'user', content: message }],
      model || process.env.GLM_MODEL_FAST || 'glm-4.7'
    );
    res.json({ response });
  } catch (error: unknown) {
    console.error('AI Chat Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/ai/parse-ticket
 * Body: { ticket_key: string, ticket_data: object, model?: string }
 * Parses a Jira ticket using GLM-5 via Python agent service
 */
router.post('/parse-ticket', async (req: Request, res: Response) => {
  const { ticket_key, ticket_data } = req.body;

  if (!ticket_key || !ticket_data) {
    return res.status(400).json({ error: 'ticket_key and ticket_data are required' });
  }

  try {
    const parsedTicket = await glmService.parseTicket(ticket_key, ticket_data);
    res.json(parsedTicket);
  } catch (error: unknown) {
    console.error('Parse Ticket Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse ticket';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/ai/analyze-task
 * Body: { description: string, model?: string }
 * Analyzes a manual task description using GLM
 */
router.post('/analyze-task', async (req: Request, res: Response) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  try {
    const analysis = await glmService.analyzeTask(description);
    res.json(analysis);
  } catch (error: unknown) {
    console.error('Analyze Task Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze task';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
