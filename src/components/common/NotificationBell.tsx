import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Trash2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import RescheduleOrRefundModal from '../features/parent/RescheduleOrRefundModal';
import { getContractById } from '../../services/api';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | 'all' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // RescheduleOrRefund modal state
  const [showRescheduleOrRefundModal, setShowRescheduleOrRefundModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: string;
    bookingId: string;
    contractId: string;
    message: string;
  } | null>(null);
  const [childId, setChildId] = useState<string | undefined>(undefined);

  const {
    notifications,
    unreadCount,
    loading,
    activeTab,
    currentPage,
    totalPages,
    fetchNotifications,   // Giữ lại để refresh thủ công
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    switchTab,
    goToPage,
  } = useNotifications();

  // Click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Đóng bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Xử lý click vào thông báo
  const handleNotificationClick = async (notification: any) => {
    if (notification.status !== 'Read') {
      await markAsRead(notification.id);
    }

    // Check if this is a RescheduleOrRefund notification
    if (notification.type === 'RescheduleOrRefund' || notification.notificationType === 'RescheduleOrRefund') {
      if (notification.bookingId && notification.contractId) {
        // Fetch childId from contract
        try {
          const contractResult = await getContractById(notification.contractId);
          if (contractResult.success && contractResult.data) {
            const contractData = contractResult.data as any;
            const mainChildId = contractData.childId || contractData.ChildId || contractData.child_id;
            setChildId(mainChildId);
          }
        } catch (error) {
          console.error('Error fetching contract for childId:', error);
          // Continue without childId - it's optional
        }
        
        setSelectedNotification({
          id: notification.id,
          bookingId: notification.bookingId,
          contractId: notification.contractId,
          message: notification.message,
        });
        setShowRescheduleOrRefundModal(true);
        setIsOpen(false);
        return;
      }
    }

    // Default behavior for other notifications
    if (notification.contractId) {
      navigate(`/contracts/${notification.contractId}`);
    } else if (notification.link) {
      navigate(notification.link);
    }

    setIsOpen(false);
  };

  // Xử lý xóa
  const handleDeleteClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeleteTarget(notificationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllClick = () => {
    setDeleteTarget('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget === 'all') {
      await deleteAllNotifications();
    } else if (deleteTarget) {
      await deleteNotification(deleteTarget);
    }
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Refresh thủ công (kéo xuống hoặc nút refresh)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  // Format thời gian
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => n.status !== 'Read')
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className={`h-5 w-5 transition-colors ${unreadCount > 0 ? 'text-blue-600' : ''}`} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-lg animate-pulse"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                  className="p-1.5 hover:bg-blue-400 rounded transition-colors disabled:opacity-50"
                  aria-label="Refresh notifications"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-blue-400 rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => switchTab('all')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => switchTab('unread')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'unread'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Action Buttons */}
          {filteredNotifications.length > 0 && (
            <div className="flex gap-2 p-3 bg-gray-50 border-b border-gray-200">
              {activeTab === 'all' && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={handleDeleteAllClick}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete all
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div>
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status !== 'Read'
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(e, notification.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {activeTab === 'all' && totalPages > 1 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              {deleteTarget === 'all'
                ? 'Delete all notifications? This cannot be undone.'
                : 'Delete this notification?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RescheduleOrRefund Modal */}
      {selectedNotification && (
        <RescheduleOrRefundModal
          isOpen={showRescheduleOrRefundModal}
          onClose={() => {
            setShowRescheduleOrRefundModal(false);
            setSelectedNotification(null);
            setChildId(undefined);
          }}
          onSuccess={() => {
            setShowRescheduleOrRefundModal(false);
            setSelectedNotification(null);
            setChildId(undefined);
            // Refresh notifications after successful action
            fetchNotifications();
          }}
          notification={{
            id: selectedNotification.id,
            bookingId: selectedNotification.bookingId,
            contractId: selectedNotification.contractId,
            message: selectedNotification.message,
          }}
          childId={childId}
        />
      )}
    </div>
  );
};

export default NotificationBell;