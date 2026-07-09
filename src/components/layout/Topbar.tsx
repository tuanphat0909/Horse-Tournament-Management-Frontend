import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Trophy, Activity, Sparkles, Wallet, Info, CheckCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export function Topbar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleNotiClick = async (noti: any) => {
    setDropdownOpen(false);
    if (!noti.isRead) {
      await markAsRead(noti.id);
    }
    if (noti.actionUrl) {
      navigate(noti.actionUrl);
    } else {
      navigate('/notifications');
    }
  };

  const getNotiIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament':
        return <Trophy size={14} className="text-purple-400" />;
      case 'race':
        return <Activity size={14} className="text-blue-400" />;
      case 'bet':
        return <Sparkles size={14} className="text-emerald-400" />;
      case 'wallet':
        return <Wallet size={14} className="text-gold" />;
      default:
        return <Info size={14} className="text-muted" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      let adjustedDateStr = dateStr;
      if (typeof adjustedDateStr === 'string' && !adjustedDateStr.endsWith('Z') && !adjustedDateStr.includes('+')) {
        adjustedDateStr = adjustedDateStr + 'Z';
      }
      const past = new Date(adjustedDateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      
      return past.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-glass-border bg-[#0B1628]/90 backdrop-blur-xl flex items-center px-8 justify-between">
      <div className="flex items-center gap-3 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder={t("Tìm kiếm ngựa, cuộc đua, giải đấu...")}
          className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`relative text-muted hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.04] ${dropdownOpen ? 'text-white bg-white/[0.04]' : ''}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-[#0B1628]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-80 glass-panel-elevated rounded-xl shadow-2xl border border-gold-border/40 overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 bg-[#0A1220]/95">
            <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between bg-white/[0.01]">
              <span className="text-xs font-bold text-champagne uppercase tracking-wider">{t("Thông báo")}</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-[10px] font-bold text-gold hover:text-white transition-colors"
                  title={t("Đánh dấu tất cả đã đọc")}
                >
                  <CheckCheck size={12} /> {t("Đánh dấu đã đọc")} ({unreadCount})
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-glass-border">
              {notifications.length > 0 ? (
                notifications.slice(0, 10).map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => handleNotiClick(noti)}
                    className={`px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-start gap-3 relative ${
                      !noti.isRead ? 'bg-gold/[0.01]' : ''
                    }`}
                  >
                    {/* Unread indicator */}
                    {!noti.isRead && (
                      <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-gold" />
                    )}

                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-glass-border flex items-center justify-center shrink-0">
                      {getNotiIcon(noti.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-bold truncate ${!noti.isRead ? 'text-white' : 'text-white/70'}`}>
                          {noti.title}
                        </span>
                        <span className="text-[9px] text-muted/50 shrink-0">
                          {formatTimeAgo(noti.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted/80 line-clamp-2 leading-relaxed">
                        {noti.content || noti.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-muted">
                  {t("Không có thông báo nào")}
                </div>
              )}
            </div>

            {/* Footer button */}
            <div className="border-t border-glass-border bg-white/[0.02] text-center">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/notifications');
                }}
                className="w-full py-2.5 text-[11px] font-bold text-champagne hover:text-white transition-colors cursor-pointer"
              >
                {t("Xem tất cả thông báo")} &rarr;
              </button>
            </div>
          </div>
        )}

        <div className="text-sm text-muted">
          <span className="text-white font-medium">{t("Season 2026")}</span> • Q3
        </div>
      </div>
    </header>
  );
}

