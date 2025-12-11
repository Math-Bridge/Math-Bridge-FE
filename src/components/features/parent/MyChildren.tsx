import React, { useState } from "react";
import { Users, Plus, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChildrenList from "../../children/ChildrenList";
import ChildForm from "../../children/ChildForm";
import ConfirmDialog from "../../common/ConfirmDialog";

// ĐÃ IMPORT ĐẦY ĐỦ 
import { Child, getChildById, softDeleteChild, restoreChild } from "../../../services/api";
import { useToast } from "../../../contexts/ToastContext";
import FallingLatexSymbols from "../../common/FallingLatexSymbols";

const MyChildren: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // STATE CHO 2 POPUP
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; childId: string | null }>({
    isOpen: false,
    childId: null
  });
  const [restoreConfirm, setRestoreConfirm] = useState<{ isOpen: boolean; childId: string | null }>({
    isOpen: false,
    childId: null
  });

  // THÊM LOADING CHO 2 HÀNH ĐỘNG
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleAddChild = () => {
    setEditingChild(null);
    setShowChildForm(true);
  };

  const handleEditChild = async (childId: string) => {
    try {
      const result = await getChildById(childId);
      if (result.success && result.data) {
        const data = result.data as any;
        const mappedChild: Child = {
          childId: data.ChildId || data.childId || childId,
          fullName: data.FullName || data.fullName || "",
          schoolId: data.SchoolId || data.schoolId || "",
          schoolName: data.SchoolName || data.schoolName || "",
          centerId: data.CenterId || data.centerId || undefined,
          centerName: data.CenterName || data.centerName || undefined,
          grade: data.Grade || data.grade || "",
          dateOfBirth: data.DateOfBirth || data.dateOfBirth || undefined,
          status: data.Status || data.status || "active",
        };
        setEditingChild(mappedChild);
        setShowChildForm(true);
      } else {
        showError("Child not found");
      }
    } catch (error) {
      console.error("Error fetching child:", error);
      showError("Failed to load child data");
    }
  };

  const handleChildFormClose = () => {
    setShowChildForm(false);
    setEditingChild(null);
    setRefreshKey((prev) => prev + 1);
  };

  // XỬ LÝ DELETE
  const handleDelete = (childId: string) => {
    setDeleteConfirm({ isOpen: true, childId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.childId) return;
    setIsDeleting(true);
    try {
      const result = await softDeleteChild(deleteConfirm.childId);
      if (result.success) {
        showSuccess('Child removed successfully');
        setRefreshKey((prev) => prev + 1);
      } else {
        showError(result.error || 'Failed to remove child');
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      showError(err.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, childId: null });
    }
  };

  // XỬ LÝ RESTORE
  const handleRestore = (childId: string) => {
    setRestoreConfirm({ isOpen: true, childId });
  };

  const handleRestoreConfirm = async () => {
    if (!restoreConfirm.childId) return;
    setIsRestoring(true);
    try {
      const result = await restoreChild(restoreConfirm.childId);
      if (result.success) {
        showSuccess('Child restored successfully!');
        setRefreshKey((prev) => prev + 1);
      } else {
        const errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('forbidden')) {
          showError('You do not have permission to restore this child.');
        } else {
          showError('Restore failed: ' + errorMsg);
        }
      }
    } catch (err: any) {
      console.error("Restore error:", err);
      showError(err.message || 'Failed to restore. Please try again later.');
    } finally {
      setIsRestoring(false);
      setRestoreConfirm({ isOpen: false, childId: null });
    }
  };

  return (
    <div className="w-full">
      {/* Falling LaTeX Symbols Background Animation */}
      <FallingLatexSymbols />
      
      {/* Subtle Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background-cream via-white to-gray-50" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-primary/15 text-7xl font-light select-none animate-float"
              style={{
                left: `${10 + (i * 70) % 85}%`,
                top: `${15 + (i * 55) % 80}%`,
                animationDelay: `${i * 3}s`,
              }}
            >
              {i % 4 === 0 ? 'π' : i % 3 === 0 ? '∑' : i % 2 === 0 ? '∫' : '∞'}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-gradient-to-b from-background-cream via-white to-gray-50 pb-8">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
          {/* Hero Header */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light rounded-2xl shadow-math-lg overflow-hidden">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="text-white">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 leading-tight flex items-center gap-4">
                      <Users className="h-10 w-10 sm:h-12 sm:w-12" />
                    My Children
                  </h1>
                    <p className="text-lg sm:text-xl opacity-95 mb-2">
                    Manage your children's learning profiles with ease
                  </p>
                    <p className="text-base opacity-80">
                    Add, edit, and track academic progress in one beautiful dashboard
                  </p>
                </div>

                <button
                  onClick={handleAddChild}
                    className="group px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-background-cream transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    Add New Child
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Children List */}
          <div className="bg-white rounded-2xl shadow-math border-2 border-primary/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
                  Children's Profiles
                </h2>
                <p className="text-gray-600 text-lg">
                  Click on any profile to view details or edit information
                </p>
              </div>
            </div>

              <ChildrenList
                key={refreshKey}
                onEditChild={handleEditChild}
                onDeleteChild={handleDelete}
                onRestoreChild={handleRestore}
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

      {/* POPUP DELETE */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Remove Child"
        message="This will hide the child from your list. You can restore later if needed."
        confirmText={isDeleting ? "Removing..." : "Remove"}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, childId: null })}
        type="danger"
        disabled={isDeleting}
      />

      {/* POPUP RESTORE */}
      <ConfirmDialog
        isOpen={restoreConfirm.isOpen}
        title="Restore Child"
        message="This will restore the child to your active list."
        confirmText={isRestoring ? "Restoring..." : "Restore"}
        cancelText="Cancel"
        onConfirm={handleRestoreConfirm}
        onCancel={() => setRestoreConfirm({ isOpen: false, childId: null })}
        type="warning"
        disabled={isRestoring}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
          .animate-float { animation: float 25s linear infinite; }
      `}} />
    </div>
  );
};

export default MyChildren;