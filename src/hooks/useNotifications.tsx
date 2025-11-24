import { useState, useEffect, useCallback } from 'react';
import { apiService, Notification } from '../services/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadCount();
      console.log('Unread count response:', response);
      
      // Handle both numeric and object responses
      if (typeof response === 'number') {
        setUnreadCount(response);
      } else if (response && typeof response === 'object') {
        const count = (response as any).count || (response as any).unreadCount || 0;
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  // Fetch notifications based on active tab
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      if (activeTab === 'all') {
        response = await apiService.getAllNotifications(currentPage, pageSize);
        console.log('All notifications response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          setNotifications(response);
          setTotalPages(1);
        } else if (response && typeof response === 'object') {
          const data = (response as any).data || (response as any).notifications || [];
          const total = (response as any).totalPages || 1;
          setNotifications(Array.isArray(data) ? data : []);
          setTotalPages(total);
        } else {
          setNotifications([]);
          setTotalPages(1);
        }
      } else {
        response = await apiService.getUnreadNotifications();
        console.log('Unread notifications response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          setNotifications(response);
        } else if (response && typeof response === 'object') {
          const data = (response as any).data || (response as any).notifications || [];
          setNotifications(Array.isArray(data) ? data : []);
        } else {
          setNotifications([]);
        }
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev?.map(n => n.id === notificationId ? { ...n, status: 'Read' } : n) || []
      );
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev?.map(n => ({ ...n, status: 'Read' })) || []
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev => prev?.filter(n => n.id !== notificationId) || []);
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount, fetchNotifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Switch tab handler
  const switchTab = useCallback((tab: 'all' | 'unread') => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  // Navigate pages
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    activeTab,
    currentPage,
    totalPages,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    switchTab,
    goToPage,
  };
};
