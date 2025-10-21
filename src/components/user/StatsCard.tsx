import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendType = 'neutral' }) => {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <p className={`text-sm font-medium ${trendColors[trendType]}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="bg-blue-100 rounded-full p-3">
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
