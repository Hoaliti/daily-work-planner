import React, { useState } from 'react';
import { type Plan, type Task } from '../types';
import LandingPage from './LandingPage';
import TaskManager from './TaskManager';
import PlanningPanel from './PlanningPanel';
import StandupGenerator from './StandupGenerator';

const Dashboard: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handlePlanSelected = (plan: Plan) => {
    setCurrentPlan(plan);
    // Load tasks for this plan
    fetchTasks(plan.id);
  };

  const fetchTasks = async (planId: string) => {
    try {
      const response = await fetch(`/api/tasks?planId=${planId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleTasksChange = async (newTasks: Task[]) => {
    setTasks(newTasks);
    // Persist to backend
    try {
      await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlan?.id, tasks: newTasks }),
      });
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);
    
    // Persist to backend
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Show landing page if no plan selected
  if (!currentPlan) {
    return <LandingPage onPlanSelected={handlePlanSelected} />;
  }

  // Main dashboard with plan selected
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Daily Work Planner</h1>
              <p className="text-xs text-gray-500">{currentPlan.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            {currentPlan.startDate} → {currentPlan.endDate}
          </span>
          <button
            onClick={() => setCurrentPlan(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Change Plan
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Column: Tasks & Standup */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Task Manager */}
            <div className="flex-1 min-h-0">
              <TaskManager
                planId={currentPlan.id}
                tasks={tasks}
                onTasksChange={handleTasksChange}
              />
            </div>
            
            {/* Standup Generator */}
            <div className="h-80">
              <StandupGenerator
                tasks={tasks}
                planId={currentPlan.id}
              />
            </div>
          </div>

          {/* Right Column: Planning Panel */}
          <div className="col-span-8">
            <PlanningPanel
              planId={currentPlan.id}
              planStartDate={currentPlan.startDate}
              planEndDate={currentPlan.endDate}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
