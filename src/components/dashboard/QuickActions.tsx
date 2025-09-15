import React from 'react';
import { Users, Calendar, Settings, BookOpen, UserPlus, CalendarPlus } from 'lucide-react';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Quản lý gia sư',
      description: '∀ tutors ∈ System: manage(tutor)',
      icon: Users,
      color: 'blue',
      onClick: () => console.log('Manage tutors')
    },
    {
      title: 'Thêm học sinh',
      description: '∫ students dt = new knowledge',
      icon: UserPlus,
      color: 'green',
      onClick: () => console.log('Add student')
    },
    {
      title: 'Lên lịch học',
      description: 'schedule(time) = max efficiency',
      icon: CalendarPlus,
      color: 'purple',
      onClick: () => console.log('Schedule session')
    },
    {
      title: 'Quản lý khóa học',
      description: '∑ courses = comprehensive learning',
      icon: BookOpen,
      color: 'orange',
      onClick: () => console.log('Manage courses')
    },
    {
      title: 'Xem lịch học',
      description: '∫ events dt = organized calendar',
      icon: Calendar,
      color: 'indigo',
      onClick: () => console.log('View calendar')
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'optimize(system) = max efficiency',
      icon: Settings,
      color: 'gray',
      onClick: () => console.log('System settings')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-900 bg-blue-50 hover:bg-blue-100',
      green: 'text-green-900 bg-green-50 hover:bg-green-100',
      purple: 'text-purple-900 bg-purple-50 hover:bg-purple-100',
      orange: 'text-orange-900 bg-orange-50 hover:bg-orange-100',
      indigo: 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100',
      gray: 'text-gray-900 bg-gray-50 hover:bg-gray-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 animate-fade-in">
        ∇ Thao tác nhanh
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all text-left hover-lift animate-scale-in stagger-${index + 1} ${getColorClasses(action.color)}`}
          >
            <action.icon className={`h-8 w-8 mb-3 animate-bounce-slow`} />
            <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;