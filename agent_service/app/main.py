"""
Python Agent Service for Daily Work Planner
Uses Z.ai SDK (zai-sdk) for GLM-5 model calls
"""

import os
import json
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from zai import ZaiClient

load_dotenv()

app = FastAPI(
    title="Agent Service",
    description="Python agent service using GLM-5 via Z.ai SDK",
    version="1.0.0"
)

# Initialize Z.ai client
zai_api_key = os.getenv("ZAI_API_KEY")
if not zai_api_key:
    raise ValueError("ZAI_API_KEY environment variable is required")

client = ZaiClient(api_key=zai_api_key)

# Default models
GLM_MODEL_FAST = os.getenv("GLM_MODEL_FAST", "glm-4.7")
GLM_MODEL_SMART = os.getenv("GLM_MODEL_SMART", "glm-5")


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    agent_type: str = "planner"
    model: str = GLM_MODEL_FAST
    max_tokens: int = 4096
    temperature: float = 0.7
    thinking_enabled: bool = True


class TicketParseRequest(BaseModel):
    ticket_key: str
    ticket_data: dict
    model: str = GLM_MODEL_SMART


class TaskAnalyzeRequest(BaseModel):
    description: str
    model: str = GLM_MODEL_FAST


class ChatResponse(BaseModel):
    response: str
    model: str
    agent_type: str


class ParsedTicket(BaseModel):
    key: str
    summary: str
    status: str
    priority: str
    description: str
    assignee: Optional[str] = None
    story_points: Optional[float] = None
    labels: list[str] = []
    components: list[str] = []
    raw_analysis: str


class TaskAnalysis(BaseModel):
    title: str
    priority: str
    description: str


# Agent system prompts
AGENT_PROMPTS = {
    "project": """You are the Project Architect agent. You help with backend, database, and overall project structure.
You provide technical guidance on architecture decisions, database design, and system integration.""",
    
    "frontend": """You are the Frontend Specialist agent. You are an expert in React, TypeScript, Tailwind CSS, and UI/UX.
You provide guidance on component design, styling, user experience, and frontend best practices.""",
    
    "planner": """You are the Daily Work Planner agent. You analyze Jira tickets and help plan the workday.
You provide structured plans, identify dependencies, estimate effort, and suggest priorities.""",
    
    "ultraworks": """You are the Ultraworks agent. You focus on deep problem solving and productivity.
You help with complex debugging, performance optimization, and advanced technical challenges."""
}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "agent_service", "sdk": "zai-sdk"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with an AI agent using Z.ai SDK
    """
    system_prompt = AGENT_PROMPTS.get(request.agent_type, AGENT_PROMPTS["planner"])
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]
    
    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=messages,
            thinking={"type": "enabled" if request.thinking_enabled else "disabled"},
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )
        
        content = response.choices[0].message.content
        
        return ChatResponse(
            response=content,
            model=request.model,
            agent_type=request.agent_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GLM API error: {str(e)}")


@app.post("/parse-ticket", response_model=ParsedTicket)
async def parse_ticket(request: TicketParseRequest):
    """
    Parse a Jira ticket using Z.ai SDK and extract structured information
    """
    ticket_json = request.ticket_data
    
    # Extract fields from Jira response
    fields = ticket_json.get("fields", {})
    
    prompt = f"""Analyze this Jira ticket and extract structured information.

Ticket Key: {request.ticket_key}
Raw Data:
- Summary: {fields.get('summary', 'N/A')}
- Status: {fields.get('status', {}).get('name', 'N/A')}
- Priority: {fields.get('priority', {}).get('name', 'N/A')}
- Description: {str(fields.get('description', 'N/A'))[:500]}
- Assignee: {fields.get('assignee', {}).get('displayName', 'Unassigned') if fields.get('assignee') else 'Unassigned'}
- Labels: {fields.get('labels', [])}
- Components: {[c.get('name', '') for c in fields.get('components', [])]}

Provide:
1. A brief analysis of what this ticket is about
2. Any potential blockers or dependencies
3. Estimated complexity
4. Suggested approach

Return a JSON object with these fields:
{{"key": "{request.ticket_key}", "summary": "brief summary", "status": "status", "priority": "High/Medium/Low", "description": "description", "assignee": "name", "story_points": null, "labels": [], "components": [], "raw_analysis": "your analysis"}}

Return ONLY valid JSON, no markdown."""

    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": "You are a Jira ticket analyzer. Return ONLY valid JSON, no markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            thinking={"type": "enabled"},
            max_tokens=2048,
            temperature=0.3,
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON from response
        try:
            json_start = content.find('{')
            json_end = content.rfind('}')
            if json_start != -1 and json_end != -1:
                parsed = json.loads(content[json_start:json_end+1])
                return ParsedTicket(**parsed)
        except json.JSONDecodeError:
            pass
        
        # Fallback: return with raw data
        return ParsedTicket(
            key=request.ticket_key,
            summary=fields.get("summary", ""),
            status=fields.get("status", {}).get("name", "Unknown"),
            priority=fields.get("priority", {}).get("name", "Medium"),
            description=str(fields.get("description", ""))[:500] if fields.get("description") else "",
            assignee=fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
            story_points=None,
            labels=fields.get("labels", []),
            components=[c.get("name", "") for c in fields.get("components", [])],
            raw_analysis=content
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse ticket: {str(e)}")


@app.post("/analyze-task", response_model=TaskAnalysis)
async def analyze_task(request: TaskAnalyzeRequest):
    """
    Analyze a manual task description using Z.ai SDK
    Extracts title, priority, and structured description
    """
    prompt = f"""Analyze this task description and extract structured information.

Task Description: {request.description}

Extract:
1. A concise title (max 50 characters)
2. Priority (High/Medium/Low) based on urgency keywords
3. A brief description of what needs to be done

Return ONLY a JSON object:
{{"title": "concise title", "priority": "High/Medium/Low", "description": "what needs to be done"}}

No markdown, just valid JSON."""

    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": "You are a task analyzer. Extract structured data from task descriptions. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            thinking={"type": "enabled"},
            max_tokens=512,
            temperature=0.3,
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON from response
        try:
            json_start = content.find('{')
            json_end = content.rfind('}')
            if json_start != -1 and json_end != -1:
                parsed = json.loads(content[json_start:json_end+1])
                return TaskAnalysis(**parsed)
        except json.JSONDecodeError:
            pass
        
        # Fallback: use original description
        return TaskAnalysis(
            title=request.description[:50],
            priority="Medium",
            description=request.description
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze task: {str(e)}")


@app.post("/generate-standup")
async def generate_standup(yesterday_logs: list[dict], today_tickets: list[dict]):
    """
    Generate standup notes using Z.ai SDK
    """
    yesterday_summary = "\n".join([
        f"- {log.get('description', 'No description')} ({log.get('duration_minutes', 0)}m)"
        for log in yesterday_logs
    ]) or "No work logged"
    
    today_summary = "\n".join([
        f"- [{t.get('key', 'Unknown')}] {t.get('summary', 'No summary')} ({t.get('status', 'Unknown')})"
        for t in today_tickets
    ]) or "No tickets planned"
    
    prompt = f"""Generate a concise standup update for me.

Yesterday I worked on:
{yesterday_summary}

Today I plan to work on:
{today_summary}

Format with **Yesterday:**, **Today:**, **Blockers:** sections."""

    try:
        response = client.chat.completions.create(
            model=GLM_MODEL_SMART,
            messages=[
                {"role": "system", "content": "You are a standup meeting assistant. Generate clear, concise standup updates."},
                {"role": "user", "content": prompt}
            ],
            thinking={"type": "enabled"},
            max_tokens=1024,
            temperature=0.7,
        )
        
        return {"standup": response.choices[0].message.content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate standup: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
