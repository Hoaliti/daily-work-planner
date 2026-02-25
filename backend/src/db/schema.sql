-- Sprints table
CREATE TABLE IF NOT EXISTS sprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'planned'))
);

-- Jira tickets cache
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, -- Jira Key (e.g., PROJ-123)
    summary TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT,
    sprint_id INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id)
);

-- Non-Jira tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, -- UUID
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done', 'blocked')),
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily work logs
CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    duration_minutes INTEGER NOT NULL,
    description TEXT NOT NULL,
    ticket_id TEXT,
    task_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    CHECK (ticket_id IS NOT NULL OR task_id IS NOT NULL)
);

-- Generated standup notes
CREATE TABLE IF NOT EXISTS standups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
