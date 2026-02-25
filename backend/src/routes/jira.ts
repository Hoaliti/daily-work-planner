import { Router, Request, Response } from 'express';
import { jiraService } from '../services/jiraService';

const router = Router();

router.get('/ticket/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const ticket = await jiraService.getTicket(key);
    res.json(ticket);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    if (errorMessage.includes('not configured')) {
      return res.status(503).json({ error: errorMessage });
    }
    res.status(500).json({ error: errorMessage });
  }

});

export default router;
