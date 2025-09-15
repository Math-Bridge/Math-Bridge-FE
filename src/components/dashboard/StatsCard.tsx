import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  formula: string;
  index: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  formula,
  index
}) => {
  return (
    <div className={`stat-card hover-lift animate-scale-in stagger-${index + 1}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-blue-50 animate-pulse-slow">
          <Icon className="h-6 w-6 text-blue-900" />
        </div>
      </div>
      <div className="mt-4">
        <span className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-blue-900' : 'text-orange-600'
        }`}>
          {change}
        </span>
        <span className="text-sm text-gray-600 ml-2">từ tháng trước</span>
        <p className="text-xs text-gray-500 mt-1 font-mono">{formula}</p>
      </div>
    </div>
  );
};

export default StatsCard;