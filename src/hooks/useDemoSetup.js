import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { setupDemoTournament } from '../api/adminService';
import { parseApiError } from '../api/authService';
import { useNotifications } from '../context/NotificationContext';

/**
 * Phím tắt dựng nhanh một giải đấu demo (Ctrl + Space).
 *
 * Backend lo toàn bộ phần nặng: tạo giải đã đóng đăng ký, 12 ngựa đã duyệt kèm
 * phiếu khám và hợp đồng nài ngựa. Hook này chỉ lo phần trải nghiệm: bắt phím,
 * chặn màn hình trong lúc chờ, bắn pháo hoa khi xong rồi tải lại danh sách.
 *
 *   const { running } = useDemoSetup(loadTournaments);
 *
 * @param {Function} onDone Gọi lại sau khi dựng xong để trang tự tải lại dữ liệu.
 */
export function useDemoSetup(onDone) {
  const { showToast } = useNotifications();
  const [running, setRunning] = useState(false);

  // Giữ trong ref để hàm bắt phím không phải tạo lại mỗi lần các giá trị này đổi
  const runningRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  /** Pháo hoa rơi từ hai bên mép màn hình trong 2 giây */
  const fireConfetti = useCallback(() => {
    const end = Date.now() + 2000;
    const colors = ['#d4af37', '#e9c46a', '#ffffff', '#34d399'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return; // chặn bấm chồng khi đang chạy
    runningRef.current = true;
    setRunning(true);
    try {
      const res = await setupDemoTournament();
      const name = res?.tournamentName ?? res?.result?.tournamentName ?? '';
      fireConfetti();
      showToast(
        'Demo tournament ready',
        name
          ? `Tournament '${name}' is ready with 12 horses and jockeys.`
          : 'The demo tournament is ready with 12 horses and jockeys.',
        'success'
      );
      await onDoneRef.current?.();
    } catch (err) {
      showToast('Could not build the demo tournament', parseApiError(err), 'error');
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [fireConfetti, showToast]);

  useEffect(() => {
    function onKeyDown(e) {
      // Ctrl + Space (dùng e.code để không phụ thuộc bố cục bàn phím)
      if (!e.ctrlKey || e.code !== 'Space' || e.altKey || e.metaKey) return;

      // Bỏ qua khi con trỏ đang ở trong ô nhập liệu — tránh cướp phím của người dùng
      const el = e.target;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;

      e.preventDefault();
      run();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [run]);

  return { running, run };
}
