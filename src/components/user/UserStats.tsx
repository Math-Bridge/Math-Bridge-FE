import React from 'react';
import { Clock, BookOpen, Star, TrendingUp } from 'lucide-react';

const UserStats: React.FC = () => {
  const stats = [
    {
      title: 'Study Hours',
      value: '24.5',
      unit: 'hours',
      change: '+3.2 this week',
      icon: Clock,
      color: 'blue',
      formula: '∫ study dt'
    },
    {
      title: 'Completed Sessions',
      value: '12',
      unit: 'sessions',
      change: '+2 this week',
      icon: BookOpen,
      color: 'green',
      formula: '∑ sessions'
    },
    {
      title: 'Average Rating',
      value: '4.8',
      unit: '/ 5.0',
      change: '+0.2 improvement',
      icon: Star,
      color: 'yellow',
      formula: 'μ = Σx/n'
    },
    {
      title: 'Progress Score',
      value: '87',
      unit: '%',
      change: '+12% this month',
      icon: TrendingUp,
      color: 'purple',
      formula: 'f(t) = 87e^(0.12t)'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 animate-fade-in">
        Your Progress
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`p-6 rounded-xl border-2 hover-lift animate-scale-in stagger-${index + 1} ${getColorClasses(stat.color)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="h-8 w-8" />
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {stat.value}
                  <span className="text-sm font-normal opacity-70 ml-1">
                    {stat.unit}
                  </span>
                </div>
              </div>
            </div>
            <h3 className="font-medium text-lg mb-2">{stat.title}</h3>
            <p className="text-sm opacity-80 mb-2">{stat.change}</p>
            <p className="text-xs font-mono opacity-60">{stat.formula}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;