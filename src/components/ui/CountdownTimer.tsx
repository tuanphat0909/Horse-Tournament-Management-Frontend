import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { parseUtcDate } from '../../utils/format';

/**
 * Đồng hồ đếm ngược tới thời điểm hết hạn (target là chuỗi datetime UTC từ BE).
 * Cập nhật mỗi giây, đổi màu: bình thường (vàng) → sắp hết < 1h (cam, nhấp nháy) → hết hạn (đỏ).
 */
function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return d > 0 ? `${d} ngày ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

interface CountdownTimerProps {
  target?: string;
  /** true (mặc định): coi target là UTC (thêm 'Z' nếu thiếu). false: giờ local như hiển thị. */
  utc?: boolean;
  /** Ẩn hẳn khi đã hết hạn (dùng cho danh sách có nhiều mục cũ). */
  hideWhenExpired?: boolean;
  className?: string;
}

export function CountdownTimer({ target, utc = true, hideWhenExpired = false, className = '' }: CountdownTimerProps) {
  const targetDate = utc ? parseUtcDate(target) : (target ? new Date(target) : null);
  const validTarget = targetDate && !isNaN(targetDate.getTime()) ? targetDate : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!validTarget) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!validTarget) return null;

  const diff = validTarget.getTime() - now;
  const expired = diff <= 0;
  if (expired && hideWhenExpired) return null;
  const urgent = !expired && diff < 60 * 60 * 1000; // còn dưới 1 giờ

  const tone = expired
    ? 'text-red-400 bg-red-500/10 border-red-500/25'
    : urgent
      ? 'text-orange-400 bg-orange-500/10 border-orange-500/25 animate-pulse'
      : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tabular-nums ${tone} ${className}`}>
      <Clock size={12} />
      {expired ? 'Đã hết hạn' : <>Còn lại: <span className="tracking-wide">{formatRemaining(diff)}</span></>}
    </span>
  );
}
