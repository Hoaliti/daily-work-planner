import { Router, Request, Response } from 'express';
import { db } from '../db';
import { opencodeService } from '../services/opencodeService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all tasks for a plan
router.get('/', (req: Request, res: Response) => {
  try {
    const { planId } = req.query;
    
    const tasks = db.prepare('SELECT * FROM tasks WHERE plan_id = ?').all(planId);
    res.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Analyze a manual task with GLM
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { description, planId } = req.body;
    
    // Call Python agent service to analyze the task
    const analysis = await opencodeService.analyzeTask(description);
    
    const taskId = uuidv4();
    
    // Create task from analysis
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, priority, status, source, created_at, plan_id)
      VALUES (?, ?, ?, ?, 'todo', 'manual', datetime('now'), ?)
    `);
    
    stmt.run(
      taskId,
      analysis.title,
      description,
      analysis.priority,
      planId
    );
    
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    res.json(newTask);
  } catch (error) {
    console.error('Failed to analyze task:', error);
    res.status(500).json({ error: 'Failed to analyze task' });
  }
});

// Update a task
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['status', 'priority', 'title', 'description'];
    const setClauses: string[] = [];
    const values: unknown[] = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    
    db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Bulk save tasks
router.post('/bulk', (req: Request, res: Response) => {
  try {
    const { planId, tasks } = req.body;
    
    // Clear existing tasks for this plan
    db.prepare('DELETE FROM tasks WHERE plan_id = ?').run(planId);
    
    // Insert all tasks
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, priority, status, source, jira_key, jira_url, estimate, assignee, created_at, plan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `);
    
    for (const task of tasks) {
      stmt.run(
        task.id || uuidv4(),
        task.title,
        task.description,
        task.priority,
        task.status,
        task.source,
        task.jiraKey || null,
        task.jiraUrl || null,
        task.estimate || null,
        task.assignee || null,
        planId
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

export default router;
