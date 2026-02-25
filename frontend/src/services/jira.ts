import axios from 'axios';

const JIRA_API_URL = '/api/jira';
const AI_API_URL = '/api/ai';

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  priority: string;
  description?: string;
  assignee?: string;
  story_points?: number | null;
  estimate?: number | null;
  raw_analysis?: string;
  labels?: string[];
  components?: string[];
}

/**
 * Fetch raw ticket data from Jira (read-only)
 */
export const getTicket = async (ticketKey: string): Promise<Record<string, unknown>> => {
  const response = await axios.get(`${JIRA_API_URL}/ticket/${ticketKey}`);
  return response.data;
};

/**
 * Parse a Jira ticket using GLM-5
 * Takes raw Jira data and returns structured ticket info
 */
export const parseTicketWithGLM = async (
  ticketKey: string,
  rawTicketData: Record<string, unknown>
): Promise<JiraTicket> => {
  const response = await axios.post(`${AI_API_URL}/parse-ticket`, {
    ticket_key: ticketKey,
    ticket_data: rawTicketData,
  });
  return response.data;
};

/**
 * Fetch and parse a ticket in one call
 * Convenience function that combines getTicket and parseTicketWithGLM
 */
export const fetchAndParseTicket = async (ticketKey: string): Promise<JiraTicket> => {
  // Step 1: Fetch raw data from Jira
  const rawData = await getTicket(ticketKey);
  
  // Step 2: Parse with GLM-5
  const parsedTicket = await parseTicketWithGLM(ticketKey, rawData);
  
  return parsedTicket;
};
