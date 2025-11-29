import React, { useState } from 'react';
import {
  Users,
  Calendar,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import UserStatistics from '../../statistics/UserStatistics';
import SessionStatistics from '../../statistics/SessionStatistics';
import TutorStatistics from '../../statistics/TutorStatistics';
import FinancialStatistics from '../../statistics/FinancialStatistics';

const AdminDashboardContent: React.FC = () => {
  const [activeStatTab, setActiveStatTab] = useState<'users' | 'sessions' | 'tutors' | 'financial'>('users');

  const statTabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'sessions' as const, label: 'Sessions', icon: Calendar },
    { id: 'tutors' as const, label: 'Tutors', icon: GraduationCap },
    { id: 'financial' as const, label: 'Financial', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System statistics and analytics</p>
      </div>

      {/* Statistics Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Statistics Tabs">
            {statTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStatTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Statistics Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeStatTab === 'users' && <UserStatistics />}
        {activeStatTab === 'sessions' && <SessionStatistics />}
        {activeStatTab === 'tutors' && <TutorStatistics />}
        {activeStatTab === 'financial' && <FinancialStatistics />}
      </div>
    </div>
  );
};

export default AdminDashboardContent;

