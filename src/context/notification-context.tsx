import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { apiOrigin, readTokens } from '@/lib/api';
import { X, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';

export type NotificationType = 'checkin' | 'cancellation' | 'payment' | 'booking' | 'locker' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  showToast: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = 'sports_center_notifications';

export function playChime(urgent = false) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 880 : 587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(urgent ? 1174.66 : 880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {}
  }, [notifications]);

  const showToast = useCallback((type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message: string, link?: string, urgent = false) => {
    const notif: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      link,
    };
    setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
    showToast(urgent ? 'warning' : 'info', title, message);
    playChime(urgent);
  }, [showToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Server-Sent Events (SSE) Stream
  useEffect(() => {
    const tokens = readTokens();
    if (!user || !tokens?.accessToken) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const sseUrl = `${apiOrigin()}/api/v1/realtime/sse?token=${encodeURIComponent(tokens.accessToken)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    // Listen to domain events
    es.addEventListener('gate.checked-in', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'gate.checked-in', data } }));
        const lockerText = data.lockerNumber ? ` (Tủ: ${data.lockerNumber})` : '';
        addNotification('checkin', 'Quẹt cổng check-in', `Lượt vào cổng mới đã được xác nhận${lockerText}.`, '/portal/desk');
        void queryClient.invalidateQueries({ queryKey: ['front-desk'] });
        void queryClient.invalidateQueries({ queryKey: ['attendances'] });
        void queryClient.invalidateQueries({ queryKey: ['lockers'] });
        void queryClient.invalidateQueries({ queryKey: ['manager', 'lockers'] });
      } catch {}
    });

    es.addEventListener('cancellation.requested', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'cancellation.requested', data } }));
        const reason = data.reasonMessage ? `: "${data.reasonMessage}"` : '';
        addNotification('cancellation', 'Yêu cầu hủy ca khẩn cấp', `HLV vừa gửi yêu cầu hủy ca đột xuất${reason}.`, '/portal/desk', true);
        void queryClient.invalidateQueries({ queryKey: ['cancellations'] });
        void queryClient.invalidateQueries({ queryKey: ['front-desk', 'requests'] });
        void queryClient.invalidateQueries({ queryKey: ['manager'] });
      } catch {}
    });

    es.addEventListener('cancellation.reviewed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'cancellation.reviewed', data } }));
        const statusText = data.status === 'APPROVED' ? 'được phê duyệt' : 'bị từ chối';
        addNotification('cancellation', 'Cập nhật yêu cầu hủy ca', `Yêu cầu hủy ca của bạn đã ${statusText}.`, undefined, data.status !== 'APPROVED');
        void queryClient.invalidateQueries({ queryKey: ['cancellations'] });
        void queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] });
        void queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
        void queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
        void queryClient.invalidateQueries({ queryKey: ['front-desk'] });
        void queryClient.invalidateQueries({ queryKey: ['manager'] });
      } catch {}
    });

    es.addEventListener('checkout.paid', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'checkout.paid', data } }));
        addNotification('payment', 'Thanh toán thành công', `Hóa đơn đã được thanh toán thành công (Mã: ${data.checkoutId?.slice(0, 8) || ''}).`, undefined, false);
        void queryClient.invalidateQueries({ queryKey: ['checkout'] });
        void queryClient.invalidateQueries({ queryKey: ['invoices'] });
        void queryClient.invalidateQueries({ queryKey: ['member'] });
      } catch {}
    });

    es.addEventListener('checkout.updated', (e: MessageEvent) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'checkout.updated', data } }));
      } catch {}
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['member'] });
    });

    es.addEventListener('booking.created', (e: MessageEvent) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'booking.created', data } }));
      } catch {}
      addNotification('booking', 'Lịch đặt mới', 'Có lịch đặt buổi tập mới trong hệ thống.', undefined, false);
      void queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] });
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    });

    es.addEventListener('booking.updated', (e: MessageEvent) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'booking.updated', data } }));
      } catch {}
      void queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    });

    es.addEventListener('locker.changed', (e: MessageEvent) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'locker.changed', data } }));
      } catch {}
      void queryClient.invalidateQueries({ queryKey: ['lockers'] });
      void queryClient.invalidateQueries({ queryKey: ['manager', 'lockers'] });
      void queryClient.invalidateQueries({ queryKey: ['member', user?.id, 'lockers'] });
    });

    es.addEventListener('schedule.updated', (e: MessageEvent) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        window.dispatchEvent(new CustomEvent('app:realtime-event', { detail: { type: 'schedule.updated', data } }));
      } catch {}
      void queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [user, addNotification, queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        showToast,
        isConnected,
      }}
    >
      {children}
      {/* Global Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 animate-bounce" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              ) : (
                <Bell className="h-5 w-5 text-[#008b74]" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-bold uppercase tracking-wider">{toast.title}</p>
              <p className="text-xs mt-0.5 font-medium leading-relaxed opacity-90">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="shrink-0 text-slate-400 hover:text-slate-700 p-0.5 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
};
