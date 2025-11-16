import { useState, useEffect, useCallback } from 'react';
import { apiService, Notification } from '../services/api';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isOpen: boolean;
  activeTab: 'all' | 'unread';
  setIsOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'all' | 'unread') => void;
  setCurrentPage: (page: number) => void;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  handleNotificationClick: (notification: Notification) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadCount();
      console.log('Unread count response:', response);
      if (response.success && response.data) {
        const count = typeof response.data === 'number' 
          ? response.data 
          : (response.data.count || 0);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch notifications based on active tab
  const fetchNotifications = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      if (activeTab === 'unread') {
        const response = await apiService.getUnreadNotifications();
        console.log('Unread notifications response:', response);
        if (response.success && response.data) {
          // API mapper already transformed to Notification[], just use it
          setNotifications(response.data);
          setTotalPages(1); // Unread doesn't have pagination
        }
      } else {
        const response = await apiService.getAllNotifications(page, 10);
        console.log('All notifications response:', response);
        if (response.success && response.data) {
          // API mapper already transformed to Notification[], just use it
          setNotifications(response.data);
          // Since API doesn't return pagination info, calculate based on data
          const pages = Math.ceil(response.data.length / 10) || 1;
          setTotalPages(pages);
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        // Update local state
        const deletedNotification = notifications?.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Update unread count if deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // Refresh notifications if page becomes empty
        if (notifications && notifications.length === 1 && currentPage > 1) {
          fetchNotifications(currentPage - 1);
        } else {
          fetchUnreadCount();
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications, currentPage, fetchNotifications, fetchUnreadCount]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await apiService.deleteAllNotifications();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
        setCurrentPage(1);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to notification link if available
    if (notification.link) {
      window.location.href = notification.link;
    }
  }, [markAsRead]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(currentPage);
    }
  }, [isOpen, activeTab, currentPage, fetchNotifications]);

  return {
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
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleNotificationClick,
  };
};
