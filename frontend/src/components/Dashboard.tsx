import React from 'react';
import TicketList from './TicketList';
import AgentTerminal from './AgentTerminal';
import StandupGenerator from './StandupGenerator';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1 rounded-md">DWP</span>
          Daily Work Planner
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>v0.1.0</span>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
            U
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column: Ticket List & Context */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <TicketList />
            </div>
            {/* Standup Generator */}
            <div className="h-1/3 hidden lg:block">
              <StandupGenerator />
            </div>
          </div>

          {/* Right Column: Agent Terminal */}
          <div className="lg:col-span-2 h-full min-h-0">
            <AgentTerminal />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
