import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Users } from 'lucide-react';
import ChildCard from './ChildCard';
import { Child, getChildrenByParent, getSchoolById } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

interface ChildrenListProps {
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
  onDeleteChild?: (childId: string) => void;
  onRestoreChild?: (childId: string) => void;
  onLinkCenter?: (childId: string) => void;
}

const ChildrenList: React.FC<ChildrenListProps> = ({
  onAddChild,
  onEditChild,
  onDeleteChild,
  onRestoreChild,
  onLinkCenter
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (user?.id) fetchChildren();
  }, [user?.id]);

  const fetchChildren = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getChildrenByParent(user.id);

      if (result.success && result.data) {
        const childrenData = Array.isArray(result.data) ? result.data : [];

        const mappedChildren = await Promise.all(
          childrenData.map(async (child: any) => {
            const { reschedule_count, ...cleanChild } = child;
            let schoolName = cleanChild.SchoolName || cleanChild.schoolName || '';

            if (!schoolName && (cleanChild.SchoolId || cleanChild.schoolId)) {
              const schoolId = cleanChild.SchoolId || cleanChild.schoolId;
              try {
                const schoolRes = await getSchoolById(schoolId);
                if (schoolRes.success && schoolRes.data) {
                  schoolName = schoolRes.data.SchoolName || schoolRes.data.schoolName || `School ${schoolId}`;
                }
              } catch (e) {
                console.warn('Could not fetch school name for ID:', schoolId);
              }
            }

            return {
              childId: cleanChild.ChildId || cleanChild.childId || String(cleanChild.id),
              fullName: cleanChild.FullName || cleanChild.fullName || '',
              schoolId: cleanChild.SchoolId || cleanChild.schoolId || '',
              schoolName: schoolName || 'No school assigned',
              centerId: cleanChild.CenterId || cleanChild.centerId || undefined,
              centerName: cleanChild.CenterName || cleanChild.centerName || undefined,
              grade: cleanChild.Grade || cleanChild.grade || '',
              dateOfBirth: cleanChild.DateOfBirth || cleanChild.dateOfBirth || undefined,
              status: (cleanChild.Status || cleanChild.status || 'active').toLowerCase(),
              avatarUrl: cleanChild.AvatarUrl || cleanChild.avatarUrl || undefined,
              avatarVersion: cleanChild.AvatarVersion || cleanChild.avatarVersion || undefined
            };
          })
        );

        setChildren(mappedChildren);
      } else {
        setChildren([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load children';
      setError(msg);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-math border-2 border-accent-red/30 p-12 text-center">
        <AlertCircle className="h-16 w-16 text-accent-red mx-auto mb-6" />
        <p className="text-primary-dark font-semibold text-lg mb-6">{error}</p>
        <button
          onClick={fetchChildren}
          className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark hover:shadow-math-lg transition-all font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {children.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-16 text-center">
          <div className="mx-auto w-32 h-32 mb-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <h3 className="text-3xl font-bold text-primary-dark mb-4">No children yet</h3>
          <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
            Start building your child's learning journey
          </p>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark hover:shadow-math-lg transition-all font-semibold flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add New Child
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {children.map((child) => (
              <div
                key={child.childId}
                className={`relative transition-all duration-300 ${
                  child.status === 'deleted' ? 'opacity-70' : ''
                }`}
              >
                {child.status === 'deleted' && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 shadow-lg">
                      Removed
                    </span>
                  </div>
                )}

                <ChildCard
                  child={child}
                  onEdit={onEditChild}
                  onDelete={onDeleteChild}
                  onRestore={child.status === 'deleted' ? onRestoreChild : undefined}
                  onLinkCenter={onLinkCenter}
                  refreshList={fetchChildren}
                />
              </div>
            ))}
          </div>

          {onAddChild && (
            <div className="flex justify-center mt-12">
              <button
                onClick={onAddChild}
                className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark hover:shadow-math-lg transition-all font-semibold flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add New Child
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChildrenList;