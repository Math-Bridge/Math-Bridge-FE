import React, { useState, useEffect } from 'react';
import { User, Plus, Loader } from 'lucide-react';
import ChildCard from './ChildCard';
import ConfirmDialog from '../common/ConfirmDialog';
import { Child, getChildrenByParent, softDeleteChild, updateChild, getSchoolById } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../contexts/ToastContext';

interface ChildrenListProps {
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
  onDeleteChild?: (childId: string) => void;
}

const ChildrenList: React.FC<ChildrenListProps> = ({
  onAddChild,
  onEditChild,
  onDeleteChild
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; childId: string | null }>({
    isOpen: false,
    childId: null
  });
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchChildren();
    }
  }, [user?.id]);

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
      setError(null);
      console.log('Calling getChildrenByParent with user ID:', user.id);
      const result = await getChildrenByParent(user.id);
      
      console.log('getChildrenByParent result:', result);
      
      if (result.success && result.data) {
        // Handle different response formats
        const childrenData = Array.isArray(result.data) ? result.data : [];
        
        // Map backend response to frontend Child interface
        // Filter out reschedule_count field that doesn't exist in backend
        // Filter out deleted children (status = "deleted")
        const mappedChildren = await Promise.all(
          childrenData
            .filter((child: any) => {
              const status = child.Status || child.status || 'active';
              return status !== 'deleted';
            })
            .map(async (child: any) => {
              // Remove reschedule_count if present to avoid errors
              const { reschedule_count, rescheduleCount, RescheduleCount, ...cleanChild } = child;
              
              let schoolName = cleanChild.SchoolName || cleanChild.schoolName || cleanChild.School?.SchoolName || cleanChild.school?.SchoolName || '';
              
              // If schoolName is empty but we have schoolId, try to fetch school name from API
              if (!schoolName || schoolName.trim() === '') {
                const schoolId = cleanChild.SchoolId || cleanChild.schoolId;
                if (schoolId) {
                  try {
                    const schoolResponse = await getSchoolById(schoolId);
                    if (schoolResponse.success && schoolResponse.data) {
                      // Backend returns SchoolDto with PascalCase: SchoolName
                      schoolName = schoolResponse.data.SchoolName || schoolResponse.data.schoolName || '';
                      console.log(`Fetched school name for ${schoolId}: ${schoolName}`);
                    }
                  } catch (error) {
                    console.error('Failed to fetch school name for schoolId:', schoolId, error);
                  }
                }
              }
              
              return {
                childId: cleanChild.ChildId || cleanChild.childId || cleanChild.id || String(cleanChild.ChildId),
                fullName: cleanChild.FullName || cleanChild.fullName || cleanChild.name || '',
                schoolId: cleanChild.SchoolId || cleanChild.schoolId || '',
                schoolName: schoolName,
                centerId: cleanChild.CenterId || cleanChild.centerId || undefined,
                centerName: cleanChild.CenterName || cleanChild.centerName || cleanChild.center?.Name || undefined,
                grade: cleanChild.Grade || cleanChild.grade || '',
                dateOfBirth: cleanChild.DateOfBirth || cleanChild.dateOfBirth || undefined,
                status: cleanChild.Status || cleanChild.status || 'active'
              };
            })
        );
        
        console.log('Mapped children (excluding deleted):', mappedChildren);
        setChildren(mappedChildren);
      } else {
        const errorMsg = result.error || 'Failed to fetch children';
        console.error('Failed to fetch children:', errorMsg);
        setError(errorMsg);
        setChildren([]); // Set empty array on error
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching children';
      console.error('Error fetching children:', err);
      setError(errorMessage);
      setChildren([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEditChild = async (childId: string) => {
    if (onEditChild) {
      onEditChild(childId);
    }
  };

  const handleDeleteClick = (childId: string) => {
    setDeleteConfirm({ isOpen: true, childId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.childId) return;

    try {
      const result = await softDeleteChild(deleteConfirm.childId);
      if (result.success) {
        showSuccess('Child deleted successfully!');
        // Refresh the children list
        await fetchChildren();
        if (onDeleteChild) {
          onDeleteChild(deleteConfirm.childId);
        }
      } else {
        const errorMsg = result.error || 'Failed to delete child';
        showError(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting child';
      showError(errorMessage);
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setDeleteConfirm({ isOpen: false, childId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, childId: null });
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
        {/* <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('children')}</h3>
            <p className="text-sm text-gray-600">
              {children.length} child{children.length !== 1 ? 'ren' : ''} {t('registered')}
            </p>
          </div>
        </div> */}

        {onAddChild && (
          <button
            onClick={onAddChild}
            className="btn-primary flex items-center space-x-2 text-sm px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addChild')}</span>
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noChildren')}</h3>
          <p className="text-gray-600 mb-6 text-sm">
            {t('getStarted')}
          </p>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="btn-primary inline-flex items-center space-x-2 text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addFirstChild')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.childId}
              child={child}
              onEdit={handleEditChild}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={t('confirmDeleteChild') || 'Confirm Delete'}
        message={t('confirmDelete') || 'Are you sure you want to delete this child? This action cannot be undone.'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
};

export default ChildrenList;
