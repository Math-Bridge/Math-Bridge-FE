import React from 'react';
import { Activity } from '../../types';
import { Users, Settings, TrendingUp, Clock, Wallet } from 'lucide-react';
import { formatRelativeTime } from '../../utils';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return Users;
      case 'payment':
        return Wallet;
      case 'system':
        return Settings;
      case 'session':
        return TrendingUp;
      default:
        return Clock;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-right">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 animate-fade-in">
          ∑ Hoạt động gần đây
        </h2>
        <button className="flex items-center space-x-2 text-blue-900 hover:text-blue-700">
          <Clock className="h-5 w-5 animate-bounce-slow" />
          <span className="text-sm">Xem tất cả</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div key={activity.id} className={`activity-item hover-lift animate-fade-in stagger-${activity.id}`}>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-pulse-slow">
                  <Icon className="h-4 w-4 text-blue-900" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(activity.time)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;