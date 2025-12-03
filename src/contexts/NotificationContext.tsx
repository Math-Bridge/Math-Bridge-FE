// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Notification } from '../services/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  activeTab: 'all' | 'unread';
  currentPage: number;
  totalPages: number;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  switchTab: (tab: 'all' | 'unread') => void;
  goToPage: (page: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true); // Bắt đầu là true để tránh flash
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadCount();
      let count = 0;
      if (typeof response === 'number') count = response;
      else if (response && typeof response === 'object') {
        count = (response as any).count ?? (response as any).unreadCount ?? 0;
      }
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'all') {
        response = await apiService.getAllNotifications(currentPage, pageSize);
        let notifs: Notification[] = [];
        let total = 1;
        if (Array.isArray(response)) notifs = response;
        else if (response && typeof response === 'object') {
          notifs = (response as any).data || (response as any).notifications || [];
          total = (response as any).totalPages ?? 1;
        }
        setNotifications(notifs);
        setTotalPages(total);

        // Tính unreadCount CHÍNH XÁC từ dữ liệu thực tế (ưu tiên hơn API count)
        const localCount = notifs.filter(n => n.status !== 'Read').length;
        setUnreadCount(localCount);
      } else {
        response = await apiService.getUnreadNotifications();
        let notifs: Notification[] = [];
        if (Array.isArray(response)) notifs = response;
        else if (response && typeof response === 'object') {
          notifs = (response as any).data || (response as any).notifications || [];
        }
        setNotifications(notifs);
        setUnreadCount(notifs.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Delete all failed:', err);
    }
  }, []);

  const switchTab = useCallback((tab: 'all' | 'unread') => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => setCurrentPage(page), []);

  // CHỈNH SỬA CHÍNH TẠI ĐÂY: Gọi fetchNotifications ngay khi mount (để có dữ liệu thật)
  useEffect(() => {
    fetchNotifications(); 


    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]); 

  return (
    <NotificationContext.Provider value={{
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
      goToPage
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};