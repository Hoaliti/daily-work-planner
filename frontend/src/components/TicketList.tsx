import React, { useState } from 'react';
import { Plus, Ticket, AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { getTicket, parseTicketWithGLM, type JiraTicket } from '../services/jira';

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [newTicketKey, setNewTicketKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketKey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch raw ticket data from Jira (read-only)
      const rawTicketData = await getTicket(newTicketKey);

      if (!rawTicketData) {
        setError('Failed to fetch ticket from Jira');
        return;
      }

      // Step 2: Parse with GLM-5 to extract structured info
      const parsedTicket = await parseTicketWithGLM(newTicketKey, rawTicketData);

      // Step 3: Add to local state
      setTickets((prev) => [...prev, parsedTicket]);
      setNewTicketKey('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch and parse ticket';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in progress':
        return <Circle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Ticket className="w-5 h-5" />
        Active Tickets
      </h2>

      <form onSubmit={handleAddTicket} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTicketKey}
          onChange={(e) => setNewTicketKey(e.target.value)}
          placeholder="Add ticket (e.g. AMPL-2037)"
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-sm mb-2 px-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {tickets.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            No tickets tracked yet. Enter a Jira ticket key above.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.key}
              className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-blue-600 text-sm">
                  {ticket.key}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-sm text-gray-800 mb-2 line-clamp-2">
                {ticket.summary}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                {getStatusIcon(ticket.status)}
                <span>{ticket.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TicketList;
