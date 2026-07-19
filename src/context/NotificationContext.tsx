/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightQuoted } from '../components/ui/HighlightQuoted';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../api/publicService';
import { getCurrentUser } from '../api/authService';

interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  content: string;
  message: string;
  type: string;
  referenceId?: number;
  thumbnail?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  isDeleted: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNoti: (id: number) => Promise<void>;
  fetchRecent: () => Promise<void>;
  showToast: (title: string, content: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [toast, setToast] = useState<{ title: string; content: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((title: string, content: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ title, content, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5000);
  }, []);

  const fetchRecent = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      // Get first page (latest 10)
      const res = await getNotifications({ page: 1, pageSize: 10 });
      const items = res?.result?.items || res?.result || [];
      
      const isAdmin = currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'systemadministrator';
      let filteredItems = Array.isArray(items) ? items : [];
      if (isAdmin) {
        filteredItems = filteredItems.filter(noti => 
          noti.type?.toLowerCase() !== 'race' && 
          noti.title !== 'Race Results Published' &&
          !(noti.actionUrl && noti.actionUrl.toLowerCase().includes('/spectator/'))
        );
      }
      setNotifications(filteredItems);

      // Also get all unread to get the accurate count
      const allRes = await getNotifications({ page: 1, pageSize: 100, isRead: false });
      const unreadItems = allRes?.result?.items || allRes?.result || [];
      
      let filteredUnread = Array.isArray(unreadItems) ? unreadItems : [];
      if (isAdmin) {
        filteredUnread = filteredUnread.filter(noti => 
          noti.type?.toLowerCase() !== 'race' && 
          noti.title !== 'Race Results Published' &&
          !(noti.actionUrl && noti.actionUrl.toLowerCase().includes('/spectator/'))
        );
      }
      const count = filteredUnread.length;
      
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNoti = async (id: number) => {
    try {
      await deleteNotification(id);
      const isUnread = notifications.find(n => n.id === id && !n.isRead);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (isUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // SignalR setup
  const user = getCurrentUser();
  const userId = user?.id || user?.userId || null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!userId || !token) {
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      return;
    }

    // Xác định ORIGIN của backend cho SignalR hub.
    // FIX DEPLOY: trước đây dùng window.location.origin (domain của FE) → khi deploy
    // FE và BE khác domain thì SignalR trỏ nhầm về FE, không nhận được thông báo.
    // Giờ suy ra origin của BE từ VITE_API_URL (mặc định = server Azure đã deploy).
    const apiURL = import.meta.env.VITE_API_URL || 'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net/api';
    const backendOrigin = apiURL.startsWith('http') ? new URL(apiURL).origin : window.location.origin;

    // Build SignalR connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${backendOrigin}/hubs/notification`, {
        accessTokenFactory: () => token
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveNotification', (noti: NotificationItem) => {
      const currentUser = getCurrentUser();
      const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'systemadministrator';
      if (isAdmin && (
        noti.type?.toLowerCase() === 'race' || 
        noti.title === 'Race Results Published' ||
        (noti.actionUrl && noti.actionUrl.toLowerCase().includes('/spectator/'))
      )) {
        return; // Ignore spectator race notifications for Admin
      }
      showToast(noti.title || 'New Notification', noti.content || noti.message, 'info');
      fetchRecent();
    });

    newConnection.start()
      .then(() => {
        console.log('[SignalR] Connected successfully.');
        setConnection(newConnection);
      })
      .catch(err => console.error('[SignalR] Connection failed:', err));

    return () => {
      newConnection.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token, fetchRecent]);

  // Initial load
  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNoti,
      fetchRecent,
      showToast
    }}>
      {children}

      {/* Floating Animated Toast */}
      <AnimatePresence>
        {toast && (() => {
          const styles = toast.type === 'success' ? {
            border: 'border-emerald-500/40',
            dot: 'bg-emerald-400',
            text: 'text-emerald-400'
          } : toast.type === 'error' ? {
            border: 'border-red-500/40',
            dot: 'bg-red-400',
            text: 'text-red-400'
          } : {
            border: 'border-gold/40',
            dot: 'bg-gold',
            text: 'text-champagne'
          };
          return (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed top-6 right-6 z-[9999] max-w-sm glass-panel rounded-xl p-4 border ${styles.border} shadow-2xl flex flex-col gap-1.5 bg-[#0d1527]/95 backdrop-blur-md`}
            >
              <div className="flex items-center justify-between border-b border-glass-border pb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
                  <span className={`text-xs font-bold ${styles.text} uppercase tracking-wider`}>{toast.title}</span>
                </div>
                <button 
                  onClick={() => setToast(null)}
                  className="text-muted hover:text-white text-[10px] uppercase font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-sans"><HighlightQuoted text={toast.content} /></p>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
