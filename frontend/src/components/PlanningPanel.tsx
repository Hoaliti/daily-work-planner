import React, { useState } from 'react';
import { Calendar, Brain, Target, Sparkles, Loader2 } from 'lucide-react';
import { type Task } from '../types';

interface PlanningPanelProps {
  planId: string;
  planStartDate: string;
  planEndDate: string;
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const PlanningPanel: React.FC<PlanningPanelProps> = ({
  planId,
  planStartDate,
  planEndDate,
  tasks,
  onTaskUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskGuidance, setTaskGuidance] = useState<Record<string, string>>({});

  const planTasks = tasks.filter(t => t.planId === planId);

  const handleGetTodayRecommendation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/planning/recommend-today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          tasks: planTasks,
        }),
      });

      if (!response.ok) throw new Error('Failed to get recommendation');

      const data = await response.json();
      setRecommendation(data.recommendation);
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      setRecommendation('Unable to generate recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetTaskGuidance = async (task: Task) => {
    setLoading(true);
    try {
      const response = await fetch('/api/planning/task-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) throw new Error('Failed to get guidance');

      const data = await response.json();
      setTaskGuidance(prev => ({ ...prev, [task.id]: data.guidance }));
      setExpandedTask(task.id);
    } catch (error) {
      console.error('Failed to get task guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    onTaskUpdate(taskId, { status: newStatus });
  };

  // Calculate days remaining in plan
  const today = new Date();
  const endDate = new Date(planEndDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Plan Overview</h2>
        </div>
        <div className="text-sm opacity-90">
          {planStartDate} → {planEndDate}
        </div>
        <div className="text-xs mt-1 opacity-75">
          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Plan ended'}
        </div>
      </div>

      {/* Today's Recommendation */}
      <div className="p-4 border-b">
        <button
          onClick={handleGetTodayRecommendation}
          disabled={loading || planTasks.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          <span className="font-medium">Recommend Today's Tasks</span>
        </button>

        {recommendation && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {recommendation}
          </div>
        )}
      </div>

      {/* Task Prioritization */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Task Priorities
        </h3>

        {planTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            Add tasks to see prioritization
          </div>
        ) : (
          <div className="space-y-2">
            {planTasks
              .sort((a, b) => {
                const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map((task, index) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xs font-bold text-gray-400 mt-1">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-800">{task.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === 'High' ? 'bg-red-100 text-red-700' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {/* Status selector */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </div>

                    {/* Ask AI button */}
                    <button
                      onClick={() => handleGetTaskGuidance(task)}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      <Brain className="w-3 h-3" />
                      How to do this?
                    </button>
                  </div>

                  {/* Expandable guidance */}
                  {expandedTask === task.id && taskGuidance[task.id] && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                      {taskGuidance[task.id]}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningPanel;
