import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, ChevronRight } from 'lucide-react';
import { type Plan } from '../types';
import api from '../services/api';

interface LandingPageProps {
  onPlanSelected: (plan: Plan) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onPlanSelected }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get<Plan[]>('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlans([]);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !startDate || !endDate) return;

    setLoading(true);
    try {
      const response = await api.post<Plan>('/plans', {
        name: newPlanName,
        startDate,
        endDate,
        status: 'active',
      });
      onPlanSelected(response.data);
    } catch (error) {
      console.error('Failed to create plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Work Planner</h1>
          <p className="text-gray-600 mt-2">Plan your work, track your progress, stay productive</p>
        </div>

        {!showNewPlanForm ? (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome back! What would you like to do?</h2>
            
            <button
              onClick={() => setShowNewPlanForm(true)}
              className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Start a New Plan</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            {plans.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Your Plans</h3>
                <div className="space-y-2">
                  {plans.filter(p => p.status === 'active').map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => onPlanSelected(plan)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <div className="font-medium text-gray-800">{plan.name}</div>
                          <div className="text-sm text-gray-500">
                            {plan.startDate} → {plan.endDate}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Plan</h2>
            
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g., Sprint 23, Q1 Goals"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPlanName || !startDate || !endDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
