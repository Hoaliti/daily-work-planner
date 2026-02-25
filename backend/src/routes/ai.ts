import { Router, Request, Response } from 'express';
import { agentService, AgentType } from '../services/agentService';
import { glmService } from '../services/glmService';

const router = Router();

/**
 * POST /api/ai/chat
 * Body: { agent: string, message: string, model?: string }
 */
router.post('/chat', async (req: Request, res: Response) => {
  const { agent, message, model } = req.body;

  if (!agent || !message) {
    return res.status(400).json({ error: 'Agent and message are required' });
  }

  try {
    const response = await agentService.chat(agent as AgentType, message, model);
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
  const { ticket_key, ticket_data, model } = req.body;

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

export default router;
