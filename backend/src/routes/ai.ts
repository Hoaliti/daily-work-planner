import { Router, Request, Response } from 'express';
import { agentService, AgentType } from '../services/agentService';

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

export default router;
