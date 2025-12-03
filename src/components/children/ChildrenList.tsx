import React, { useState, useEffect } from 'react';
import { Plus, Loader, AlertCircle } from 'lucide-react';
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

  const AddButton = () => (
    <button
      onClick={onAddChild}
      className="group relative px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl 
        border border-blue-700/50 overflow-hidden
        transition-all duration-400 ease-out
        hover:shadow-2xl hover:shadow-blue-600/40 hover:bg-blue-700
        hover:rotate-1 transform-gpu
        flex items-center gap-3"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Plus className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
      <span className="relative z-10">Add New Child</span>
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 animate-pulse">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-200 rounded-full" />
              <div className="space-y-3 flex-1">
                <div className="h-6 bg-blue-200 rounded w-64" />
                <div className="h-4 bg-blue-100 rounded w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur-xl rounded-2xl border border-red-200 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button
          onClick={fetchChildren}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {children.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-16 text-center">
          <div className="mx-auto w-28 h-28 mb-8 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H9a4 4 0 01-4-4V9a4 4 0 014-4h6a4 4 0 014 4v8a4 4 0 01-4 4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No children yet</h3>
          <p className="text-gray-600 mb-10 max-w-md mx-auto text-lg">
            Start building your child's learning journey
          </p>
          {onAddChild && <AddButton />}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {children.map((child) => (
              <div
                key={child.childId}
                className={`relative transition-all duration-300 ${
                  child.status === 'deleted' ? 'opacity-70 scale-95' : ''
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
              <AddButton />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChildrenList;