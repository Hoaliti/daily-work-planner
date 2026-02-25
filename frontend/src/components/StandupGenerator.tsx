import React, { useState } from 'react';
import { Mic, Copy, Loader2, Sparkles } from 'lucide-react';
import { type Task } from '../types';

interface StandupGeneratorProps {
  tasks: Task[];
  planId: string;
}

const StandupGenerator: React.FC<StandupGeneratorProps> = ({ tasks, planId }) => {
  const [yesterdayWork, setYesterdayWork] = useState('');
  const [todayForecast, setTodayForecast] = useState('');
  const [blockers, setBlockers] = useState('');
  const [generatedStandup, setGeneratedStandup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!yesterdayWork.trim() && !todayForecast.trim()) {
      setError('Please provide at least what you did yesterday or your plan for today');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/standup/generate-interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          yesterdayWork,
          todayForecast,
          blockers,
          todayTasks: tasks.filter(t => 
            t.planId === planId && 
            (t.status === 'in_progress' || t.status === 'todo')
          ),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate standup');

      const data = await response.json();
      setGeneratedStandup(data.standup);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate standup');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedStandup);
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          <h3 className="font-semibold">Daily Standup</h3>
        </div>
        <p className="text-xs opacity-90 mt-1">Tell me about your work and I'll generate a standup update</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Yesterday */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What did you do yesterday?
          </label>
          <textarea
            value={yesterdayWork}
            onChange={(e) => setYesterdayWork(e.target.value)}
            placeholder="e.g., Finished the login page, worked on API integration..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
          />
        </div>

        {/* Today */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What's your plan for today?
          </label>
          <textarea
            value={todayForecast}
            onChange={(e) => setTodayForecast(e.target.value)}
            placeholder="e.g., Planning to work on the dashboard, start the database migration..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
          />
        </div>

        {/* Blockers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Any blockers? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g., Waiting for code review, need access to..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={2}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all font-medium"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'Generating...' : 'Generate Standup Update'}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Generated Output */}
        {generatedStandup && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Standup Update
            </label>
            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {generatedStandup}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-8 right-2 flex items-center gap-1 text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50 shadow-sm"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandupGenerator;
