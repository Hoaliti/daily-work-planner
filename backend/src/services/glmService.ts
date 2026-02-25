import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GLM_API_URL = process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = process.env.GLM_API_KEY;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
        GLM_API_URL,
        {
          model,
          messages,
        },
        {
          headers: {
            'Authorization': `Bearer ${GLM_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Unexpected response format from GLM API');
      }
    } catch (error: any) {
      console.error('Error calling GLM API:', error.response?.data || error.message);
      throw new Error(`GLM API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export const glmService = GLMService.getInstance();
