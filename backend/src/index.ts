import 'dotenv/config'; // MUST be first - load env before any imports

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initDB } from './db';
import jiraRoutes from './routes/jira';
import aiRoutes from './routes/ai';
import standupRoutes from './routes/standup';
import plansRoutes from './routes/plans';
import tasksRoutes from './routes/tasks';
import planningRoutes from './routes/planning';


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/standup', standupRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/planning', planningRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    initDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
