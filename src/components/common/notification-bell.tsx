import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  CheckCheck,
  Trash2,
  ScanLine,
  AlertTriangle,
  CreditCard,
  Calendar,
  Key,
  Info,
} from 'lucide-react';
import { useNotification, type AppNotification, type NotificationType } from '@/context/notification-context';

function formatRelativeTime(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
  } catch {
    return '';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'checkin':
      return <ScanLine className="h-4 w-4 text-emerald-600" />;
    case 'cancellation':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'booking':
      return <Calendar className="h-4 w-4 text-purple-600" />;
    case 'locker':
      return <Key className="h-4 w-4 text-teal-600" />;
    default:
      return <Info className="h-4 w-4 text-slate-500" />;
  }
}

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, isConnected } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.read
  );

  const handleItemClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isConnected ? 'Thông báo thời gian thực' : 'Mất kết nối thông báo'}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-200'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Connection pulse dot */}
        <span
          className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={isConnected ? 'Realtime kết nối' : 'Đang thử kết nối lại'}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  title="Đánh dấu tất cả đã đọc"
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Đã đọc hết</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 px-4 pt-1 gap-4 bg-white text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Không có thông báo nào.</p>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                    item.read
                      ? 'bg-white hover:bg-slate-50 opacity-80'
                      : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="shrink-0 p-2 rounded-xl bg-slate-100 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${item.read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-600 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2 bg-slate-50/60 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 pl-2">
                {isConnected ? '● SSE Online' : '○ SSE Đang thử lại'}
              </span>
              <button
                type="button"
                onClick={() => clearAll()}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <Trash2 className="h-3 w-3" />
                <span>Xóa lịch sử</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
