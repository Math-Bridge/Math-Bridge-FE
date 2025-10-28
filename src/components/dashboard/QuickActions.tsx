import React from 'react';
import { Users, Calendar, Settings, BookOpen, UserPlus, CalendarPlus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const QuickActions: React.FC = () => {
  const { t } = useTranslation();
  
  const actions = [
    {
      title: t('manageTutors'),
      description: t('manageTutorsDesc'),
      icon: Users,
      color: 'blue',
      onClick: () => console.log('Manage tutors')
    },
    {
      title: t('addStudent'),
      description: t('addStudentDesc'),
      icon: UserPlus,
      color: 'green',
      onClick: () => console.log('Add student')
    },
    {
      title: t('scheduleSession'),
      description: t('scheduleSessionDesc'),
      icon: CalendarPlus,
      color: 'purple',
      onClick: () => console.log('Schedule session')
    },
    {
      title: t('manageCourses'),
      description: t('manageCoursesDesc'),
      icon: BookOpen,
      color: 'orange',
      onClick: () => console.log('Manage courses')
    },
    {
      title: t('viewCalendar'),
      description: t('viewCalendarDesc'),
      icon: Calendar,
      color: 'indigo',
      onClick: () => console.log('View calendar')
    },
    {
      title: t('systemSettings'),
      description: t('systemSettingsDesc'),
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
    <div className="mt-8 w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 animate-fade-in">
        ∇ Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
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