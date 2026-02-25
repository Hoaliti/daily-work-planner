import axios from 'axios';

const API_URL = '/api/jira'; // Assuming a proxy or backend route

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  priority: string;
}

export const getTicket = async (ticketKey: string): Promise<JiraTicket> => {
  const response = await axios.get(`${API_URL}/ticket/${ticketKey}`);
  return response.data;
};

export const getTickets = async (): Promise<JiraTicket[]> => {
    // Mock implementation for now, or fetch from a real endpoint if available
    // In a real app, this might fetch a list of tickets assigned to the user
    return [];
};
