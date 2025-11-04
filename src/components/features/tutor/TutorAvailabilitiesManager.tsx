import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Monitor, MapPin, AlertCircle } from 'lucide-react';
import {
  getMyAvailabilities,
  deleteTutorAvailability,
  updateTutorAvailabilityStatus,
  TutorAvailability,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { ConfirmDialog } from '../../../components/common';
import AvailabilityForm from './AvailabilityForm';

type TutorAvailabilityItem = TutorAvailability;

function formatDays(daysOfWeek: number): string {
  const mapping = [
    { bit: 1, label: 'Sun' },
    { bit: 2, label: 'Mon' },
    { bit: 4, label: 'Tue' },
    { bit: 8, label: 'Wed' },
    { bit: 16, label: 'Thu' },
    { bit: 32, label: 'Fri' },
    { bit: 64, label: 'Sat' }
  ];
  return mapping
    .filter(d => (daysOfWeek & d.bit) !== 0)
    .map(d => d.label)
    .join(', ');
}

const TutorAvailabilitiesManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<TutorAvailabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TutorAvailabilityItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null }>({
    isOpen: false,
    itemId: null,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAvailabilities(false); // Get all, not just active
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        const errorMsg = res.error || 'Failed to load availabilities';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: TutorAvailabilityItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setDeleteConfirm({ isOpen: true, itemId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.itemId) return;

    try {
      const result = await deleteTutorAvailability(deleteConfirm.itemId);
      if (result.success) {
        showSuccess('Availability deleted successfully!');
        await fetchData();
      } else {
        showError(result.error || 'Failed to delete availability');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      showError(errorMsg);
    } finally {
      setDeleteConfirm({ isOpen: false, itemId: null });
    }
  };

  const handleUpdateStatus = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const result = await updateTutorAvailabilityStatus(itemId, { status: newStatus });
      if (result.success) {
        showSuccess(`Availability ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        await fetchData();
      } else {
        showError(result.error || 'Failed to update status');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      showError(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading availabilities...</span>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-red-200">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">My Availabilities</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your teaching schedule</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Availability</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No availabilities yet.</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Availability
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold text-gray-700">Days</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Time</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Effective Period</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Format</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.availabilityId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {formatDays(item.daysOfWeek).split(', ').map((day, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {item.availableFrom} - {item.availableUntil}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {item.effectiveFrom}
                          {item.effectiveUntil ? ` → ${item.effectiveUntil}` : ' (ongoing)'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {item.canTeachOnline && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            <Monitor className="w-3 h-3" />
                            <span>Online</span>
                          </span>
                        )}
                        {item.canTeachOffline && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>Offline</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'inactive'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => item.availabilityId && handleUpdateStatus(item.availabilityId, item.status || 'active')}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {item.status === 'active' ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => item.availabilityId && handleDeleteClick(item.availabilityId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <AvailabilityForm
          availability={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSuccess={fetchData}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this availability? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        type="danger"
      />
    </>
  );
};

export default TutorAvailabilitiesManager;


