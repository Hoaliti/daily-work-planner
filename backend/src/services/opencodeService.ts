import axios from 'axios';

// OpenCode server configuration
// By default, connects to locally running opencode server
const OPENCODE_URL = process.env.OPENCODE_URL || 'http://127.0.0.1:4096';

// Model configuration
const MODEL_SMART = process.env.OPENCODE_MODEL_SMART || 'zai-coding-plan/glm-5';
const MODEL_FAST = process.env.OPENCODE_MODEL_FAST || 'zai-coding-plan/glm-4.7';

// Agent system prompts
const AGENT_PROMPTS: Record<string, string> = {
  project: `You are the Project Architect agent. You help with backend, database, and overall project structure.
You provide technical guidance on architecture decisions, database design, and system integration.`,

  frontend: `You are the Frontend Specialist agent. You are an expert in React, TypeScript, Tailwind CSS, and UI/UX.
You provide guidance on component design, styling, user experience, and frontend best practices.`,

  planner: `You are the Daily Work Planner agent. You analyze Jira tickets and help plan the workday.
You provide structured plans, identify dependencies, estimate effort, and suggest priorities.`,

  ultraworks: `You are the Ultraworks agent. You focus on deep problem solving and productivity.
You help with complex debugging, performance optimization, and advanced technical challenges.`,
};

interface ChatResponse {
  response: string;
  model: string;
  agentType: string;
}

interface ParsedTicket {
  key: string;
  summary: string;
  status: string;
  priority: string;
  description: string;
  assignee?: string;
  story_points?: number;
  labels: string[];
  components: string[];
  raw_analysis: string;
}

interface TaskAnalysis {
  title: string;
  priority: string;
  description: string;
}

/**
 * Extract text from opencode response parts
 */
function extractTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  let text = '';
  for (const part of parts) {
    if (part.type === 'text' && part.text) {
      text += part.text;
    }
  }
  return text;
}

/**
 * Try to parse JSON from text response
 */
function tryParseJson<T>(text: string, fallback: T): T {
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = text.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr) as T;
    }
  } catch {
    // Ignore parse errors
  }
  return fallback;
}

class OpenCodeService {
  private async createSession(title: string): Promise<string> {
    const response = await axios.post(`${OPENCODE_URL}/session`, { title });
    return response.data.id;
  }

  private async sendPrompt(sessionId: string, parts: Array<{ type: string; text: string }>, modelId?: string): Promise<string> {
    const body: {
      parts: Array<{ type: string; text: string }>;
      model?: { providerID: string; modelID: string };
    } = { parts };
    
    if (modelId) {
      body.model = { providerID: 'zai-coding-plan', modelID: modelId };
    }
    
    const response = await axios.post(`${OPENCODE_URL}/session/${sessionId}/prompt`, body);
    return extractTextFromParts(response.data.parts || []);
  }

  /**
   * Send a chat message to an AI agent
   */
  async chat(message: string, agentType: string = 'planner', useSmartModel: boolean = false): Promise<ChatResponse> {
    const model = useSmartModel ? MODEL_SMART : MODEL_FAST;
    const modelId = useSmartModel ? 'glm-5' : 'glm-4.7';
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.planner;

    // Create session
    const sessionId = await this.createSession(`Chat - ${agentType}`);

    // Send system prompt + user message together
    const responseText = await this.sendPrompt(sessionId, [
      { type: 'text', text: `${systemPrompt}\n\nUser: ${message}` }
    ], modelId);

    return {
      response: responseText,
      model,
      agentType,
    };
  }

  /**
   * Parse a Jira ticket and extract structured information
   */
  async parseTicket(ticketKey: string, ticketData: Record<string, unknown>): Promise<ParsedTicket> {
    const fields = (ticketData.fields as Record<string, unknown>) || {};

    const prompt = `Analyze this Jira ticket and extract structured information.

Ticket Key: ${ticketKey}
Raw Data:
- Summary: ${fields.summary || 'N/A'}
- Status: ${(fields.status as Record<string, unknown>)?.name || 'N/A'}
- Priority: ${(fields.priority as Record<string, unknown>)?.name || 'N/A'}
- Description: ${String(fields.description || 'N/A').slice(0, 500)}
- Assignee: ${(fields.assignee as Record<string, unknown>)?.displayName || 'Unassigned'}
- Labels: ${JSON.stringify(fields.labels || [])}
- Components: ${JSON.stringify(((fields.components as Array<Record<string, unknown>>) || []).map(c => c.name))}

Provide:
1. A brief analysis of what this ticket is about
2. Any potential blockers or dependencies
3. Estimated complexity
4. Suggested approach

Return a JSON object with these fields EXACTLY:
{"key": "${ticketKey}", "summary": "brief summary", "status": "status", "priority": "High/Medium/Low", "description": "description", "assignee": "name", "story_points": null, "labels": [], "components": [], "raw_analysis": "your analysis"}

Return ONLY valid JSON, no markdown.`;

    const sessionId = await this.createSession(`Parse Ticket - ${ticketKey}`);
    const responseText = await this.sendPrompt(sessionId, [{ type: 'text', text: prompt }], 'glm-5');
    
    // Try to parse JSON from response
    const fallback: ParsedTicket = {
      key: ticketKey,
      summary: String(fields.summary || ''),
      status: String((fields.status as Record<string, unknown>)?.name || 'Unknown'),
      priority: String((fields.priority as Record<string, unknown>)?.name || 'Medium'),
      description: String(fields.description || '').slice(0, 500),
      assignee: (fields.assignee as Record<string, unknown>)?.displayName as string | undefined,
      story_points: undefined,
      labels: (fields.labels as string[]) || [],
      components: ((fields.components as Array<Record<string, unknown>>) || []).map(c => String(c.name)),
      raw_analysis: responseText,
    };
    
    return tryParseJson(responseText, fallback);
  }

  /**
   * Analyze a manual task description
   */
  async analyzeTask(description: string): Promise<TaskAnalysis> {
    const prompt = `Analyze this task description and extract structured information.

Task Description: ${description}

Extract:
1. A concise title (max 50 characters)
2. Priority (High/Medium/Low) based on urgency keywords
3. A brief description of what needs to be done

Return ONLY a JSON object EXACTLY:
{"title": "concise title", "priority": "High/Medium/Low", "description": "what needs to be done"}

No markdown, just valid JSON.`;

    const sessionId = await this.createSession('Analyze Task');
    const responseText = await this.sendPrompt(sessionId, [{ type: 'text', text: prompt }], 'glm-4.7');
    
    // Try to parse JSON from response
    const fallback: TaskAnalysis = {
      title: description.slice(0, 50),
      priority: 'Medium',
      description,
    };
    
    return tryParseJson(responseText, fallback);
  }

  /**
   * Generate standup notes
   */
  async generateStandup(yesterdayLogs: Array<{ description: string; duration_minutes: number }>, todayTickets: Array<{ key: string; summary: string; status: string }>): Promise<string> {
    const yesterdaySummary = yesterdayLogs.length > 0
      ? yesterdayLogs.map(log => `- ${log.description} (${log.duration_minutes}m)`).join('\n')
      : 'No work logged';

    const todaySummary = todayTickets.length > 0
      ? todayTickets.map(t => `- [${t.key}] ${t.summary} (${t.status})`).join('\n')
      : 'No tickets planned';

    const prompt = `Generate a concise standup update for me.

Yesterday I worked on:
${yesterdaySummary}

Today I plan to work on:
${todaySummary}

Format with **Yesterday:**, **Today:**, **Blockers:** sections.`;

    const sessionId = await this.createSession('Generate Standup');
    return this.sendPrompt(sessionId, [{ type: 'text', text: prompt }], 'glm-5');
  }
}

export const opencodeService = new OpenCodeService();
