import React, { useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
// Notification type imported in the hook

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const {
    notifications,
    unreadCount,
    totalPages,
    currentPage,
    isLoading,
    isOpen,
    activeTab,
    setIsOpen,
    setActiveTab,
    setCurrentPage,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleNotificationClick,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      deleteAllNotifications();
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotification(id);
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? (notifications || []).filter(n => !n.isRead) 
    : (notifications || []);

  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('NotificationBell - isOpen:', isOpen);
      console.log('NotificationBell - notifications:', notifications);
      console.log('NotificationBell - filteredNotifications:', filteredNotifications);
      console.log('NotificationBell - isLoading:', isLoading);
      console.log('NotificationBell - activeTab:', activeTab);
    }
  }, [isOpen, notifications, filteredNotifications, isLoading, activeTab]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell 
          className={`h-6 w-6 text-gray-600 transition-transform ${isOpen ? 'scale-110' : ''}`}
          aria-hidden="true"
        />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center animate-pulse"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications && notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center space-x-1"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setActiveTab('unread');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                activeTab === 'unread'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'opacity-80'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-2">
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm mb-1 ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Pagination */}
          {activeTab === 'all' && totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>
              <span className="text-xs text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
