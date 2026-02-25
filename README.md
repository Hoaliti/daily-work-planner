# 📋 Daily Work Planner

A powerful daily work planning tool that integrates with Jira and uses AI agents to help you manage your sprint tasks, generate standup updates, and plan your workday efficiently.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## ✨ Features

- **🎫 Jira Integration**: Fetch and track your Jira tickets directly from the app
- **🤖 AI-Powered Agents**: Four specialized AI agents to assist you:
  - **Project Agent**: Backend, database, and architecture assistance
  - **Frontend Agent**: React, Tailwind CSS, and UI/UX expert
  - **Planner Agent**: Daily work planning and standup generation
  - **Ultraworks Agent**: Deep problem solving and productivity
- **📊 Standup Generator**: Automatically generate daily standup updates based on your work logs and tickets
- **📝 Non-Jira Tasks**: Track tasks that aren't in Jira
- **💾 Local SQLite Database**: All data stored locally for privacy
- **🎨 Modern UI**: Clean, responsive interface with dark mode terminal

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hoaliti/daily-work-planner.git
   cd daily-work-planner
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Server
   PORT=3001
   DB_PATH=./database.db
   NODE_ENV=development

   # Jira Configuration
   JIRA_DOMAIN=your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_TOKEN=your-jira-api-token

   # GLM AI Configuration (ZCode.ai / ZhipuAI)
   GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
   GLM_API_KEY=your-glm-api-key
   GLM_MODEL_FAST=glm-4-flash
   GLM_MODEL_SMART=glm-4-plus
   ```

   > **Getting API Tokens:**
   > - **Jira**: Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens) to create an API token
   > - **GLM**: Sign up at [ZhipuAI](https://open.bigmodel.cn/) to get your API key

5. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
daily-work-planner/
├── backend/                    # Express + TypeScript API
│   ├── src/
│   │   ├── db/                # SQLite database setup
│   │   │   ├── index.ts       # Database connection
│   │   │   └── schema.sql     # Database schema
│   │   ├── routes/            # API endpoints
│   │   │   ├── ai.ts          # AI chat endpoints
│   │   │   ├── jira.ts        # Jira integration
│   │   │   └── standup.ts     # Standup generation
│   │   ├── services/          # Business logic
│   │   │   ├── agentService.ts # AI agent management
│   │   │   ├── glmService.ts   # GLM API client
│   │   │   ├── jiraService.ts  # Jira API client
│   │   │   └── standupService.ts
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Server entry point
│   ├── .env.example           # Environment template
│   └── package.json
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AgentTerminal.tsx   # AI chat interface
│   │   │   ├── Dashboard.tsx       # Main layout
│   │   │   ├── StandupGenerator.tsx
│   │   │   └── TicketList.tsx
│   │   ├── services/          # API clients
│   │   │   ├── api.ts
│   │   │   ├── ai.ts
│   │   │   ├── jira.ts
│   │   │   └── standup.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore
```

## 🔌 API Endpoints

### Jira
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jira/ticket/:key` | Fetch a Jira ticket by key |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with an AI agent |

**Request Body:**
```json
{
  "agent": "planner",
  "message": "Help me plan my day",
  "model": "glm-4-flash"
}
```

### Standup
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/standup/generate` | Generate standup notes |
| GET | `/api/standup/:date` | Get standup by date |

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `sprints` | Sprint management |
| `tickets` | Cached Jira tickets |
| `tasks` | Non-Jira tasks |
| `work_logs` | Daily work logs |
| `standups` | Generated standup notes |

## 🎨 Screenshots

### Dashboard View
The main dashboard shows your active tickets and the AI agent terminal.

### Agent Terminal
Chat with different AI agents for specialized assistance.

### Standup Generator
Generate your daily standup update with one click.

## 🛠️ Development

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Run in Production

```bash
# Backend
cd backend
npm start

# Frontend (after build)
cd frontend
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Express](https://expressjs.com/) - Backend Framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [ZhipuAI](https://open.bigmodel.cn/) - AI Models
- [Atlassian Jira](https://www.atlassian.com/software/jira) - Issue Tracking

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ for productive developers
