import React, { useState } from 'react';
import { Plus, Ticket, ListTodo, ExternalLink, Trash2, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { getTicket, parseTicketWithGLM } from '../services/jira';
import { type Task } from '../types';

interface TaskManagerProps {
  planId: string;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ planId, tasks, onTasksChange
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'jira'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual task form
  const [taskDescription, setTaskDescription] = useState('');

  // Jira form
  const [jiraKey, setJiraKey] = useState('');

  const handleAddManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Call backend to analyze task with GLM
      const response = await fetch('/api/tasks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: taskDescription,
          planId,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze task');

      const analyzedTask: Task = await response.json();
      onTasksChange([...tasks, analyzedTask]);
      setTaskDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJiraTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch from Jira (read-only)
      const rawTicketData = await getTicket(jiraKey);

      // Step 2: Parse with GLM-5
      const parsedTicket = await parseTicketWithGLM(jiraKey, rawTicketData);

      // Step 3: Convert to Task
      const newTask: Task = {
        id: `jira-${jiraKey}-${Date.now()}`,
        title: parsedTicket.summary,
        description: parsedTicket.description || '',
        priority: parsedTicket.priority === 'High' ? 'High' : 
                 parsedTicket.priority === 'Medium' ? 'Medium' : 'Low',
        status: 'todo',
        source: 'jira',
        jiraKey: jiraKey.toUpperCase(),
        // Jira URL will be configured in backend,        jiraUrl: undefined,
        estimate: parsedTicket.story_points || undefined,
        assignee: parsedTicket.assignee || undefined,
        createdAt: new Date().toISOString(),
        planId,
      };

      onTasksChange([...tasks, newTask]);
      setJiraKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Jira ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = (taskId: string) => {
    onTasksChange(tasks.filter(t => t.id !== taskId));
  };

  const handleOpenJira = (jiraUrl: string | undefined) => {
    if (jiraUrl) {
      window.open(jiraUrl, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Circle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const planTasks = tasks.filter(t => t.planId === planId);

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'manual'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Add Task
        </button>
        <button
          onClick={() => setActiveTab('jira')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'jira'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Jira
        </button>
      </div>

      {/* Form */}
      <div className="p-4 border-b">
        {activeTab === 'manual' ? (
          <form onSubmit={handleAddManualTask} className="flex gap-2">
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe your task..."
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !taskDescription.trim()}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAddJiraTicket} className="flex gap-2">
            <input
              type="text"
              value={jiraKey}
              onChange={(e) => setJiraKey(e.target.value)}
              placeholder="Jira key (e.g. AMPL-2037)"
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !jiraKey.trim()}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {planTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No tasks yet. Add a task above to get started.
          </div>
        ) : (
          planTasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {task.source === 'jira' ? (
                    <span className="text-blue-600 font-medium text-sm">{task.jiraKey}</span>
                  ) : (
                    <ListTodo className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.jiraUrl && (
                    <button
                      onClick={() => handleOpenJira(task.jiraUrl)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Open in Jira"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-800 mb-2">{task.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {getStatusIcon(task.status)}
                <span className="capitalize">{task.status.replace('_', ' ')}</span>
                {task.estimate && <span>• {task.estimate} pts</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
