import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db';
import jiraRoutes from './routes/jira';
import aiRoutes from './routes/ai';
import standupRoutes from './routes/standup';




dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Jira routes
app.use('/api/jira', jiraRoutes);
// AI routes
app.use('/api/ai', aiRoutes);
// Standup routes
app.use('/api/standup', standupRoutes);





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
