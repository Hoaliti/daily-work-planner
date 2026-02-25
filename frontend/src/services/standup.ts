import api from './api';
import { type Task } from '../types';

export interface Standup {
  date: string;
  content: string;
  generatedAt: string;
}

export const generateStandup = async (date: string): Promise<Standup> => {
  const response = await api.post<Standup>('/standup/generate', { date });
  return response.data;
};

export const generateInteractiveStandup = async (
  planId: string,
  yesterdayWork: string,
  todayForecast: string,
  blockers: string,
  todayTasks: Task[]
): Promise<{ standup: string }> => {
  const response = await api.post<{ standup: string }>('/standup/generate-interactive', {
    planId,
    yesterdayWork,
    todayForecast,
    blockers,
    todayTasks,
  });
  return response.data;
};

export const getStandup = async (date: string): Promise<Standup> => {
  const response = await api.get<Standup>(`/standup/${date}`);
  return response.data;
};
