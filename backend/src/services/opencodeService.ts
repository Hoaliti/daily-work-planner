import { createOpencode, createOpencodeClient } from '@opencode-ai/sdk';

// Model configuration - uses opencode's zai-coding-plan
const MODEL_SMART = process.env.OPENCODE_MODEL_SMART || 'zai-coding-plan/glm-5';
const MODEL_FAST = process.env.OPENCODE_MODEL_FAST || 'zai-coding-plan/glm-4.7';

// OpenCode client singleton
let opencodeInstance: Awaited<ReturnType<typeof createOpencode>> | null = null;
let clientOnly: ReturnType<typeof createOpencodeClient> | null = null;

/**
 * Initialize OpenCode client
 * If OPENCODE_SERVER_URL is set, connects to existing server
 * Otherwise, starts a new server instance
 */
async function getClient() {
  const serverUrl = process.env.OPENCODE_SERVER_URL;
  
  if (serverUrl) {
    // Connect to existing opencode server
    if (!clientOnly) {
      clientOnly = createOpencodeClient({ baseUrl: serverUrl });
    }
    return clientOnly;
  }
  
  // Start new opencode server
  if (!opencodeInstance) {
    opencodeInstance = await createOpencode({
      hostname: process.env.OPENCODE_HOST || '127.0.0.1',
      port: parseInt(process.env.OPENCODE_PORT || '4096'),
    });
    console.log(`OpenCode server started at ${opencodeInstance.server.url}`);
  }
  return opencodeInstance.client;
}

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
 * Extract text from a session prompt result
 */
function extractTextFromResult(result: { data?: { parts?: Array<{ type: string; text?: string }> } }): string {
  let text = '';
  if (result.data?.parts) {
    for (const part of result.data.parts) {
      if (part.type === 'text' && part.text) {
        text += part.text;
      }
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
  /**
   * Send a chat message to an AI agent
   */
  async chat(message: string, agentType: string = 'planner', useSmartModel: boolean = false): Promise<ChatResponse> {
    const client = await getClient();
    const model = useSmartModel ? MODEL_SMART : MODEL_FAST;
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.planner;

    // Create a session for this conversation
    const session = await client.session.create({
      body: { title: `Chat - ${agentType}` },
    });

    if (!session.data?.id) {
      throw new Error('Failed to create session');
    }

    // Send system prompt as context
    await client.session.prompt({
      path: { id: session.data.id },
      body: {
        noReply: true,
        parts: [{ type: 'text', text: systemPrompt }],
      },
    });

    // Send user message
    const result = await client.session.prompt({
      path: { id: session.data.id },
      body: {
        model: { providerID: 'zai-coding-plan', modelID: useSmartModel ? 'glm-5' : 'glm-4.7' },
        parts: [{ type: 'text', text: message }],
      },
    });

    const responseText = extractTextFromResult(result);

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
    const client = await getClient();
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

    // Create session
    const session = await client.session.create({
      body: { title: `Parse Ticket - ${ticketKey}` },
    });

    if (!session.data?.id) {
      throw new Error('Failed to create session');
    }

    const result = await client.session.prompt({
      path: { id: session.data.id },
      body: {
        model: { providerID: 'zai-coding-plan', modelID: 'glm-5' },
        parts: [{ type: 'text', text: prompt }],
      },
    });

    const responseText = extractTextFromResult(result);
    
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
    const client = await getClient();

    const prompt = `Analyze this task description and extract structured information.

Task Description: ${description}

Extract:
1. A concise title (max 50 characters)
2. Priority (High/Medium/Low) based on urgency keywords
3. A brief description of what needs to be done

Return ONLY a JSON object EXACTLY:
{"title": "concise title", "priority": "High/Medium/Low", "description": "what needs to be done"}

No markdown, just valid JSON.`;

    // Create session
    const session = await client.session.create({
      body: { title: 'Analyze Task' },
    });

    if (!session.data?.id) {
      throw new Error('Failed to create session');
    }

    const result = await client.session.prompt({
      path: { id: session.data.id },
      body: {
        model: { providerID: 'zai-coding-plan', modelID: 'glm-4.7' },
        parts: [{ type: 'text', text: prompt }],
      },
    });

    const responseText = extractTextFromResult(result);
    
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
    const client = await getClient();

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

    // Create session
    const session = await client.session.create({
      body: { title: 'Generate Standup' },
    });

    if (!session.data?.id) {
      throw new Error('Failed to create session');
    }

    const result = await client.session.prompt({
      path: { id: session.data.id },
      body: {
        model: { providerID: 'zai-coding-plan', modelID: 'glm-5' },
        parts: [{ type: 'text', text: prompt }],
      },
    });

    return extractTextFromResult(result);
  }
}

export const opencodeService = new OpenCodeService();
