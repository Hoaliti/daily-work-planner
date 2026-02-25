import { glmService } from './glmService';

export type AgentType = 'project' | 'frontend' | 'planner' | 'ultraworks';

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  defaultModel: string;
}

export const AGENTS: Record<AgentType, AgentConfig> = {
  project: {
    name: 'Project Architect',
    systemPrompt: 'You are the Project Architect. You help with backend, database, and overall structure.',
    defaultModel: process.env.GLM_MODEL_SMART || 'glm-4-plus',
  },
  frontend: {
    name: 'Frontend Specialist',
    systemPrompt: 'You are the Frontend Specialist. You are an expert in React, Tailwind, and UI/UX.',
    defaultModel: process.env.GLM_MODEL_SMART || 'glm-4-plus',
  },
  planner: {
    name: 'Daily Work Planner',
    systemPrompt: 'You are the Daily Work Planner. You analyze Jira tickets and help plan the day.',
    defaultModel: process.env.GLM_MODEL_FAST || 'glm-4-flash',
  },
  ultraworks: {
    name: 'Ultraworks Agent',
    systemPrompt: 'You are the Ultraworks Agent. You focus on deep problem solving and productivity.',
    defaultModel: process.env.GLM_MODEL_SMART || 'glm-4-plus',
  },
};

export class AgentService {
  async chat(agentType: AgentType, userMessage: string, model?: string) {
    const agent = AGENTS[agentType];
    if (!agent) {
      throw new Error(`Invalid agent type: ${agentType}`);
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const selectedModel = model || agent.defaultModel;

    return await glmService.chat(messages, selectedModel);
  }
}

export const agentService = new AgentService();
