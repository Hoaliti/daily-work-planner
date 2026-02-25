import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GLM_SERVICE_URL = process.env.GLM_SERVICE_URL || 'http://localhost:3002';
const GLM_API_KEY = process.env.GLM_API_KEY;
const GLM_MODEL_FAST = process.env.GLM_MODEL_FAST || 'glm-4.7';
const GLM_MODEL_SMART = process.env.GLM_MODEL_SMART || 'glm-5';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TaskAnalysis {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ParsedTicket {
  key: string;
  summary: string;
  status: string;
  priority: string;
  description: string | null;
  assignee: string | null;
  story_points: number | null;
  estimate: number | null;
  raw_analysis: string;
}

class GLMServiceClass {
  async chat(messages: Message[], model: string = GLM_MODEL_FAST): Promise<string> {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.post(
        `${GLM_SERVICE_URL}/chat`,
        {
          message: messages[messages.length - 1].content,
          model,
          max_tokens: 4096,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLM_API_KEY}`,
          },
        }
      );

      if (response.data && response.data.response) {
        return response.data.response;
      }
      throw new Error('Unexpected response format from Python agent service');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Python agent service error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  async parseTicket(ticketKey: string, ticketData: Record<string, unknown>): Promise<ParsedTicket> {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.post(
        `${GLM_SERVICE_URL}/parse-ticket`,
        {
          ticket_key: ticketKey,
          ticket_data: ticketData,
          model: GLM_MODEL_SMART,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLM_API_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Python agent service error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  async analyzeTask(description: string): Promise<TaskAnalysis> {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.post(
        `${GLM_SERVICE_URL}/analyze-task`,
        {
          description,
          model: GLM_MODEL_FAST,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLM_API_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Python agent service error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }
}

export const glmService = new GLMServiceClass();
