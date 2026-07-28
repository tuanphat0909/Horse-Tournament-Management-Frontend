/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useReducer, useEffect, useCallback, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightQuoted } from '../components/ui/HighlightQuoted';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../api/publicService';
import { getCurrentUser } from '../api/authService';
import { filterNotisForRole, isNotiForRole, toRoleKey } from '../utils/notificationFilter';

const NotificationContext = createContext(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  toast: null,
};

function notificationReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, notifications: action.notifications, unreadCount: action.unreadCount };
    case 'FETCH_ERROR':
      return { ...state, loading: false };
    case 'CLEAR_ALL':
      return { ...state, notifications: [], unreadCount: 0 };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    case 'DELETE': {
      // Xoá một thông báo chưa đọc thì phải giảm cả số đếm — một action lo cả hai
      const wasUnread = state.notifications.some((n) => n.id === action.id && !n.isRead);
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }
    case 'SHOW_TOAST':
      return { ...state, toast: action.toast };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { notifications, unreadCount, loading, toast } = state;
  const [connection, setConnection] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((title, content, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    dispatch({ type: 'SHOW_TOAST', toast: { title, content, type } });
    toastTimerRef.current = setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
      toastTimerRef.current = null;
    }, 5000);
  }, []);

  const fetchRecent = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      dispatch({ type: 'CLEAR_ALL' });
      return;
    }
    dispatch({ type: 'FETCH_START' });
    try {
      // Chỉ hiện thông báo liên quan tới vai trò đang đăng nhập
      const roleKey = toRoleKey(currentUser.role);

      // Phải lấy rộng rồi mới lọc theo role: nếu chỉ lấy 10 bản ghi mới nhất thì
      // sau khi lọc có thể chỉ còn 1-2 cái, lệch hẳn với số chưa đọc hiển thị.
      const res = await getNotifications({ page: 1, pageSize: 100 });
      const items = res?.result?.items || res?.result || [];

      // Also get all unread to get the accurate count
      const allRes = await getNotifications({ page: 1, pageSize: 100, isRead: false });
      const unreadItems = allRes?.result?.items || allRes?.result || [];

      dispatch({
        type: 'FETCH_SUCCESS',
        // Dropdown chỉ cần 10 cái mới nhất — cắt sau khi đã lọc theo role
        notifications: filterNotisForRole(Array.isArray(items) ? items : [], roleKey).slice(0, 10),
        unreadCount: filterNotisForRole(Array.isArray(unreadItems) ? unreadItems : [], roleKey).length,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      dispatch({ type: 'FETCH_ERROR' });
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      dispatch({ type: 'MARK_READ', id });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      dispatch({ type: 'MARK_ALL_READ' });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNoti = async (id) => {
    try {
      await deleteNotification(id);
      dispatch({ type: 'DELETE', id });
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
        accessTokenFactory: () => token,
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveNotification', (noti) => {
      const currentUser = getCurrentUser();
      // Bỏ qua thông báo không thuộc vai trò đang đăng nhập
      if (!isNotiForRole(noti, toRoleKey(currentUser?.role))) return;
      showToast(noti.title || 'New Notification', noti.content || noti.message, 'info');
      fetchRecent();
    });

    newConnection
      .start()
      .then(() => {
        console.log('[SignalR] Connected successfully.');
        setConnection(newConnection);
      })
      .catch((err) => console.error('[SignalR] Connection failed:', err));

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
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNoti,
        fetchRecent,
        showToast,
      }}
    >
      {children}

      {/* Floating Animated Toast */}
      <AnimatePresence>
        {toast &&
          (() => {
            const styles =
              toast.type === 'success'
                ? {
                    border: 'border-emerald-500/40',
                    dot: 'bg-emerald-400',
                    text: 'text-emerald-400',
                  }
                : toast.type === 'error'
                  ? {
                      border: 'border-red-500/40',
                      dot: 'bg-red-400',
                      text: 'text-red-400',
                    }
                  : {
                      border: 'border-gold/40',
                      dot: 'bg-gold',
                      text: 'text-champagne',
                    };
            return (
              <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} transition={{ duration: 0.25, ease: 'easeOut' }} className={`fixed top-6 right-6 z-[9999] max-w-sm glass-panel rounded-xl p-4 border ${styles.border} shadow-2xl flex flex-col gap-1.5 bg-[#0d1527]/95 backdrop-blur-md`}>
                <div className="flex items-center justify-between border-b border-glass-border pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
                    <span className={`text-xs font-bold ${styles.text} uppercase tracking-wider`}>{toast.title}</span>
                  </div>
                  <button onClick={() => dispatch({ type: 'HIDE_TOAST' })} className="text-muted hover:text-white text-[10px] uppercase font-semibold cursor-pointer">
                    Close
                  </button>
                </div>
                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  <HighlightQuoted text={toast.content} />
                </p>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};
