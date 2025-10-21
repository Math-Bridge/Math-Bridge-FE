import React from 'react';
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';

const UserStats: React.FC = () => {
  const displayStats = {
    totalSessions: 24,
    completedSessions: 3,
    totalHours: 48,
    problemsSolved: 85,
    currentStreak: 7
  };

  const statCards = [
    {
      title: 'Total Sessions',
      value: displayStats.totalSessions,
      icon: BookOpen,
      color: 'blue',
      subtitle: `${displayStats.completedSessions} completed`
    },
    {
      title: 'Study Hours',
      value: displayStats.totalHours,
      icon: Clock,
      color: 'green',
      subtitle: 'Total learning time'
    },
    {
      title: 'Problems Solved',
      value: displayStats.problemsSolved,
      icon: Target,
      color: 'purple',
      subtitle: 'Practice problems'
    },
    {
      title: 'Current Streak',
      value: `${displayStats.currentStreak} days`,
      icon: TrendingUp,
      color: 'orange',
      subtitle: 'Keep it going!'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`${getColorClasses(stat.color)} rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`h-8 w-8 ${getIconColor(stat.color)}`} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
            <p className="text-xs text-gray-600">{stat.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;
