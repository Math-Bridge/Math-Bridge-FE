import React, { useState } from 'react';
import {
  Users,
  Plus,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChildrenList from '../../children/ChildrenList';
import ChildForm from '../../children/ChildForm';
import { Child, getChildById } from '../../../services/api';
import { useTranslation } from '../../../hooks/useTranslation';

const MyChildren: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddChild = () => {
    setEditingChild(null);
    setShowChildForm(true);
  };

  const handleEditChild = async (childId: string) => {
    try {
      const result = await getChildById(childId);
      if (result.success && result.data) {
        setEditingChild(result.data);
        setShowChildForm(true);
      } else {
        console.error('Failed to fetch child:', result.error);
      }
    } catch (error) {
      console.error('Error fetching child:', error);
    }
  };

  const handleChildFormClose = () => {
    setShowChildForm(false);
    setEditingChild(null);
    setRefreshKey(prev => prev + 1);
  };

  const quickActions = [
    {
      title: t('viewCourses'),
      description: t('browseCourses'),
      icon: BookOpen,
      color: 'orange',
      onClick: () => navigate('/courses')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
    };
    return colors[color as keyof typeof colors] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('myChildren')}</h1>
          <p className="text-gray-600 mt-2">{t('manageProfiles')}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-6 rounded-xl shadow-sm border ${getColorClasses(action.color)} hover:shadow-md hover:-translate-y-1 transition-all duration-200`}
              >
                <action.icon className="h-8 w-8 mb-3" />
                <span className="text-lg font-semibold">{action.title}</span>
                <span className="text-sm text-gray-600 mt-1 text-center">{action.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Children Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-6 w-6 text-blue-500 mr-2" />
              {t('myChildren')}
            </h2>
            <button
              onClick={handleAddChild}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('addChild')}</span>
            </button>
          </div>
          
          <ChildrenList
            key={refreshKey}
            onEditChild={handleEditChild}
          />
        </div>

            {/* Child Form Modal */}
            {showChildForm && (
              <ChildForm
                child={editingChild || undefined}
                onClose={handleChildFormClose}
                onSuccess={handleChildFormClose}
              />
            )}
          </div>
        </div>
      );
    };

export default MyChildren;
