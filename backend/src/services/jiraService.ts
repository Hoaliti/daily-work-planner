import axios from 'axios';

export class JiraService {
  private readonly domain: string;
  private readonly email: string;
  private readonly token: string;

  constructor() {
    this.domain = process.env.JIRA_DOMAIN || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.token = process.env.JIRA_TOKEN || '';

    if (!this.domain || !this.email || !this.token) {
      console.warn('Jira credentials are not fully configured in environment variables.');
    }
  }

  async getTicket(key: string) {
    if (!this.domain || !this.email || !this.token) {
      throw new Error('Jira service is not configured');
    }

    const url = `https://${this.domain}/rest/api/3/issue/${key}`;
    const auth = Buffer.from(`${this.email}:${this.token}`).toString('base64');

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 404) {
            throw new Error(`Ticket ${key} not found`);
          }
          throw new Error(`Jira API error: ${error.response.status} ${error.response.statusText}`);
        }
      }
      throw error;
    }

  }
}

export const jiraService = new JiraService();
