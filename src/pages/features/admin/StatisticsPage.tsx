import React, { useState } from 'react';
import { Users, Calendar, GraduationCap, DollarSign } from 'lucide-react';
import UserStatistics from '../../../components/statistics/UserStatistics';
import SessionStatistics from '../../../components/statistics/SessionStatistics';
import TutorStatistics from '../../../components/statistics/TutorStatistics';
import FinancialStatistics from '../../../components/statistics/FinancialStatistics';

const StatisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'tutors' | 'financial'>('users');

  const tabs = [
    { id: 'users' as const, label: 'Người dùng', icon: Users },
    { id: 'sessions' as const, label: 'Phiên học', icon: Calendar },
    { id: 'tutors' as const, label: 'Gia sư', icon: GraduationCap },
    { id: 'financial' as const, label: 'Tài chính', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê hệ thống</h1>
          <p className="text-gray-600">Xem và phân tích dữ liệu hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'users' && <UserStatistics />}
          {activeTab === 'sessions' && <SessionStatistics />}
          {activeTab === 'tutors' && <TutorStatistics />}
          {activeTab === 'financial' && <FinancialStatistics />}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;











