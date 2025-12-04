import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { API_BASE_URL } from '../constants';

const SSE_URL = `${API_BASE_URL}/Notification/sse/connect`;

// Backend notification format from API
export interface BackendNotification {
  NotificationId?: string;
  UserId?: string;
  ContractId?: string;
  BookingId?: string;
  Title?: string;
  Message?: string;
  NotificationType?: string;
  Status?: string;
  CreatedDate?: string;
  SentDate?: string | null;
  IsRead?: boolean;
}

// Frontend notification format
export interface SSENotification {
  id?: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  data?: unknown;
}

interface UseSSENotificationsOptions {
  onNotification?: (notification: SSENotification) => void;
  autoConnect?: boolean;
  showToast?: boolean;
}

export const useSSENotifications = (options: UseSSENotificationsOptions = {}) => {
  const {
    onNotification,
    autoConnect = true,
    showToast = true,
  } = options;

  const { showInfo, showSuccess, showWarning, showError } = useToast();
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Helper function to remove ID from notification message
  const removeIdFromMessage = useCallback((message: string): string => {
    if (!message) return message;
    
    // Remove various ID patterns:
    // - (ID: xxx), (NotificationId: xxx), (ContractId: xxx), etc.
    // - - ID: xxx, - NotificationId: xxx, etc.
    // - [ID: xxx], [NotificationId: xxx], etc.
    // - ID: xxx, NotificationId: xxx, etc. (at the end)
    let cleaned = message
      .replace(/\s*\([^)]*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)[^)]*\)/g, '')
      .replace(/\s*-\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)\s*:\s*[^\s]+/g, '')
      .replace(/\s*\[\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)[^\]]*\s*\]/g, '')
      .replace(/\s*(?:[Ii][Dd]|NotificationId|ContractId|BookingId|UserId|MessageId)\s*:\s*[a-fA-F0-9-]{8,}(?:\s|$)/g, '')
      .trim();
    
    return cleaned || message; // Return original if cleaned is empty
  }, []);

  // Map backend notification format to frontend format
  const mapBackendNotification = useCallback((backendData: BackendNotification): SSENotification => {
    // Determine notification type based on NotificationType or default to 'info'
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';
    
    if (backendData.NotificationType) {
      const notifType = backendData.NotificationType.toLowerCase();
      if (notifType.includes('reminder') || notifType.includes('upcoming')) {
        type = 'info';
      } else if (notifType.includes('success') || notifType.includes('complete')) {
        type = 'success';
      } else if (notifType.includes('warning') || notifType.includes('cancel')) {
        type = 'warning';
      } else if (notifType.includes('error') || notifType.includes('fail')) {
        type = 'error';
      }
    }

    const rawMessage = backendData.Message || 'New notification';
    const cleanedMessage = removeIdFromMessage(rawMessage);
    const cleanedTitle = backendData.Title ? removeIdFromMessage(backendData.Title) : undefined;

    return {
      id: backendData.NotificationId,
      title: cleanedTitle,
      message: cleanedMessage,
      type,
      timestamp: backendData.CreatedDate || backendData.SentDate || new Date().toISOString(),
      data: backendData,
    };
  }, [removeIdFromMessage]);

  const handleNotification = useCallback((notification: SSENotification) => {
    console.log('SSE Notification received:', notification);

    // Call custom handler if provided
    if (onNotification) {
      onNotification(notification);
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = notification.title
        ? `${notification.title}: ${notification.message}`
        : notification.message;

      switch (notification.type) {
        case 'success':
          showSuccess(message);
          break;
        case 'warning':
          showWarning(message);
          break;
        case 'error':
          showError(message);
          break;
        case 'info':
        default:
          showInfo(message);
          break;
      }
    }
  }, [onNotification, showToast, showInfo, showSuccess, showWarning, showError]);

  const connect = useCallback(() => {
    // Don't reconnect if already connected
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSourcePolyfill.CLOSED) {
      console.log('SSE already connected');
      return;
    }

    try {
      console.log('Connecting to SSE:', SSE_URL);

      // Get auth token for authenticated connection
      const token = localStorage.getItem('authToken');
      
      // Create EventSource with Bearer token in Authorization header
      const eventSource = new EventSourcePolyfill(SSE_URL, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        heartbeatTimeout: 120000, // 2 minutes
      });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      eventSource.onmessage = (event) => {
        console.log('SSE raw message received:', event.data);
        try {
          const backendData = JSON.parse(event.data) as BackendNotification;
          console.log('SSE parsed backend data:', backendData);
          
          // Map backend format to frontend format
          const mappedNotification = mapBackendNotification(backendData);
          console.log('SSE mapped notification:', mappedNotification);
          
          handleNotification(mappedNotification);
        } catch (error) {
          console.error('Error parsing SSE message:', error, 'Raw data:', event.data);
          // If it's not JSON, treat it as a plain text message
          handleNotification({
            message: event.data,
            type: 'info',
          });
        }
      };

      // Handle specific event types if the server sends them
      eventSource.addEventListener('notification', (event: any) => {
        console.log('SSE notification event received:', event.data);
        try {
          const backendData = JSON.parse(event.data) as BackendNotification;
          console.log('SSE notification event parsed:', backendData);
          
          // Map backend format to frontend format
          const mappedNotification = mapBackendNotification(backendData);
          console.log('SSE notification event mapped:', mappedNotification);
          
          handleNotification(mappedNotification);
        } catch (error) {
          console.error('Error parsing notification event:', error, 'Raw data:', event.data);
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
    }
  }, [handleNotification, mapBackendNotification]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting SSE');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: eventSourceRef.current?.readyState === EventSourcePolyfill.OPEN,
  };
};

