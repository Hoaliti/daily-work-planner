import axios from 'axios';

const API_URL = '/api/ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
}

export const sendChatMessage = async (message: string, context: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_URL}/chat`, {
    message,
    context,
  });
  return response.data;
};
