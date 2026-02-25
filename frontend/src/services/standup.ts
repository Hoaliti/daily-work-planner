import api from './api';

export interface Standup {
  date: string;
  content: string;
  generatedAt: string;
}

export const generateStandup = async (date: string): Promise<Standup> => {
  const response = await api.post<Standup>('/standup/generate', { date });
  return response.data;
};

export const getStandup = async (date: string): Promise<Standup> => {
  const response = await api.get<Standup>(`/standup/${date}`);
  return response.data;
};
