import { Router, Request, Response } from 'express';
import { standupService } from '../services/standupService';

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
  } catch (error: any) {
    console.error('Error generating standup:', error);
    res.status(500).json({ error: error.message || 'Failed to generate standup' });
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
  } catch (error: any) {
    console.error('Error fetching standup:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch standup' });
  }
});

export default router;
