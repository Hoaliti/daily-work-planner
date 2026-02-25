import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GLM_SERVICE_URL = process.env.GLM_SERVICE_URL || 'http://localhost:3002';
const GLM_API_KEY = process.env.GLM_API_KEY;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  model: string;
}

export interface TicketParseResponse {
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

export class GLMService {
  private static instance: GLMService;

  private constructor() {}

  public static getInstance(): GLMService {
    if (!GLMService.instance) {
      GLMService.instance = new GLMService();
    }
    return GLMService.instance;
  }

  public async chat(messages: Message[], model: string = process.env.GLM_MODEL_FAST || 'glm-4-flash'): Promise<string> {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.post(
        `${GLM_SERVICE_URL}/chat`,
        {
          message: messages[messages.length - 1].content,
          agent_type: 'planner',
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
      } else {
        throw new Error('Unexpected response format from Python agent service');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Python agent service error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  public async parseTicket(ticketKey: string, ticketData: Record<string, unknown>): Promise<TicketParseResponse> {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.post(
        `${GLM_SERVICE_URL}/parse-ticket`,
        {
          ticket_key: ticketKey,
          ticket_data: ticketData,
          model: 'glm-5',
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
        throw new Error(`Python agent service error: ${error.response?.data?.detail || error.message}`)
      }
      throw error;
    }
  }
}

export const glmService = GLMService.getInstance();
