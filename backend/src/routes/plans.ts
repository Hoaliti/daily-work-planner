import { Router, Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create a new plan
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, status } = req.body;
    const planId = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO plans (id, name, start_date, end_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(planId, name, startDate, endDate, status || 'active');
    
    const newPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    res.json(newPlan);
  } catch (error) {
    console.error('Failed to create plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Get all plans
router.get('/', (req: Request, res: Response) => {
  try {
    const plans = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get a specific plan
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Failed to fetch plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// Update plan status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    db.prepare('UPDATE plans SET status = ? WHERE id = ?').run(status, id);
    
    const updatedPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Failed to update plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

export default router;
