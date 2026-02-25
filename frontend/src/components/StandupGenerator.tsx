import React, { useState, useEffect } from 'react';
import { generateStandup, getStandup } from '../services/standup';
import { AxiosError } from 'axios';

const StandupGenerator: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateStandup(date);
      setContent(result.content);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      setError(error.response?.data?.error || 'Failed to generate standup');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStandup(date);
      setContent(result.content);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      // If 404, it just means no standup generated yet, which is fine.
      if (error.response?.status === 404) {
        setContent('');
      } else {
        setError(error.response?.data?.error || 'Failed to fetch standup');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      fetchStandup();
    }
  }, [date]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Daily Standup
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`text-xs px-3 py-1 rounded text-white font-medium transition-colors ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <textarea
          value={content}
          readOnly
          className="w-full h-full resize-none text-sm text-gray-700 border border-gray-200 rounded p-3 focus:outline-none focus:border-blue-500 bg-gray-50 font-mono whitespace-pre-wrap"
          placeholder="Select a date and click Generate to create your standup update..."
        />
        {content && (
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="absolute top-2 right-2 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-50 shadow-sm"
            title="Copy to clipboard"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
};

export default StandupGenerator;
