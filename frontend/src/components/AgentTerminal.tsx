import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, MessageSquare, Code, Briefcase, Calendar, Zap } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../services/ai';

const AgentTerminal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'project' | 'frontend' | 'planner' | 'ultraworks'>('project');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(input, activeTab);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.message };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Error: Failed to get response from the agent.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'project', label: 'Project', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'frontend', label: 'Frontend', icon: <Code className="w-4 h-4" /> },
    { id: 'planner', label: 'Planner', icon: <Calendar className="w-4 h-4" /> },
    { id: 'ultraworks', label: 'Ultraworks', icon: <Zap className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden shadow-xl border border-gray-700">
      {/* Header / Tabs */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 px-2 pt-2">
        <div className="flex items-center gap-2 px-4 py-2 text-gray-400 border-r border-gray-700 mr-2">
          <Terminal className="w-5 h-5" />
          <span className="font-mono text-sm font-bold hidden sm:inline">AGENT_TERM</span>
        </div>
        
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
            <Terminal className="w-12 h-12 mb-4" />
            <p>Select an agent context and start typing...</p>
            <p className="text-xs mt-2">Current Context: {activeTab.toUpperCase()}</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-75 text-xs uppercase tracking-wider font-bold">
                  {msg.role === 'user' ? 'You' : `Agent [${activeTab}]`}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 rounded-lg px-4 py-3 border border-gray-700 animate-pulse">
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <div className="absolute left-3 top-3 text-gray-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${activeTab} agent...`}
            className="flex-1 bg-gray-900 text-white pl-10 pr-4 py-3 rounded-md border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm placeholder-gray-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[3rem]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentTerminal;
