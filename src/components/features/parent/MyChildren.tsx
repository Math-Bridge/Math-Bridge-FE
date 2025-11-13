import React, { useState } from "react";
import { Users, Plus, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChildrenList from "../../children/ChildrenList";
import ChildForm from "../../children/ChildForm";
import ConfirmDialog from "../../common/ConfirmDialog";

// ĐÃ IMPORT ĐẦY ĐỦ – KHÔNG CÒN LỖI 500
import { Child, getChildById, softDeleteChild, restoreChild } from "../../../services/api";
import { useToast } from "../../../contexts/ToastContext";

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
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-100/20 via-transparent to-emerald-100/20 animate-gradient-reverse" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute text-cyan-300/10 text-6xl font-black select-none animate-float"
              style={{
                left: `${15 + ((i * 60) % 80)}%`,
                top: `${20 + ((i * 45) % 75)}%`,
                animationDelay: `${i * 2.5}s`,
              }}
            >
              {i % 4 === 0 ? "π" : i % 3 === 0 ? "∞" : i % 2 === 0 ? "∑" : "∫"}
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-screen py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 mb-10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 p-10 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <h1 className="text-5xl font-black mb-4 flex items-center gap-4">
                    <Users className="h-12 w-12" />
                    My Children
                  </h1>
                  <p className="text-xl opacity-90 leading-relaxed">
                    Manage your children's learning profiles with ease
                  </p>
                  <p className="text-sm opacity-70 mt-3">
                    Add, edit, and track academic progress in one beautiful dashboard
                  </p>
                </div>

                <button
                  onClick={handleAddChild}
                  className="group relative px-10 py-5 bg-white text-cyan-600 font-bold text-lg rounded-2xl shadow-xl 
                    border border-cyan-200/50 backdrop-blur-sm overflow-hidden transition-all duration-400 ease-out
                    hover:shadow-2xl hover:shadow-cyan-500/30 hover:bg-cyan-50 hover:border-cyan-300 hover:rotate-1 transform-gpu
                    flex items-center gap-3 whitespace-nowrap"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Plus className="h-7 w-7 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative z-10">Add New Child</span>
                  <Sparkles className="h-6 w-6 relative z-10 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>

          {/* Children List */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <BookOpen className="h-9 w-9 text-cyan-600" />
                  Children's Profiles
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  Click on any profile to view details or edit information
                </p>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                translate-x-[-100%] animate-shimmer" />
              <ChildrenList
                key={refreshKey}
                onEditChild={handleEditChild}
                onDeleteChild={handleDelete}
                onRestoreChild={handleRestore}
              />
            </div>
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

      {/* ANIMATIONS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradient { 0%, 100% { transform: translateX(-5%) translateY(-5%); } 50% { transform: translateX(5%) translateY(5%); } }
          @keyframes gradient-reverse { 0%, 100% { transform: translateX(5%) translateY(5%); } 50% { transform: translateX(-5%) translateY(-5%); } }
          @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(8deg); } }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          .animate-gradient { animation: gradient 30s ease infinite; }
          .animate-gradient-reverse { animation: gradient-reverse 35s ease infinite; }
          .animate-float { animation: float 25s linear infinite; }
          .animate-shimmer { animation: shimmer 4s infinite; }
        `,
      }} />
    </>
  );
};

export default MyChildren;