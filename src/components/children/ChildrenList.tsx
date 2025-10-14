import React, { useState, useEffect } from 'react';
import { User, Plus, Loader } from 'lucide-react';
import ChildCard from './ChildCard';
import { Child, getChildrenByParent } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface ChildrenListProps {
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
  onDeleteChild?: (childId: string) => void;
  onLinkCenter?: (childId: string) => void;
}

const ChildrenList: React.FC<ChildrenListProps> = ({
  onAddChild,
  onEditChild,
  onDeleteChild,
  onLinkCenter
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    console.log('Fetching children for user:', user);
    if (!user?.id) {
      console.error('User not authenticated or missing ID:', user);
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Calling getChildrenByParent with user ID:', user.id);
      const result = await getChildrenByParent(user.id);
      
      if (result.success && result.data) {
        setChildren(result.data);
      } else {
        setError(result.error || 'Failed to fetch children');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching children';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchChildren}
          className="mt-4 btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Children</h3>
            <p className="text-sm text-gray-600">
              {children.length} child{children.length !== 1 ? 'ren' : ''} registered
            </p>
          </div>
        </div>

        {onAddChild && (
          <button
            onClick={onAddChild}
            className="btn-primary flex items-center space-x-2 text-sm px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Child</span>
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No children registered</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Get started by adding your first child to the system
          </p>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="btn-primary inline-flex items-center space-x-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Child</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.childId}
              child={child}
              onEdit={onEditChild}
              onDelete={onDeleteChild}
              onLinkCenter={onLinkCenter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildrenList;
