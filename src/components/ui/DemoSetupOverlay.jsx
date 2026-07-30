import { motion, AnimatePresence } from 'framer-motion';

/**
 * Màn hình chặn khi đang dựng giải đấu demo bằng phím tắt Ctrl + Space.
 * Che toàn bộ giao diện để người dùng không bấm tiếp trong lúc backend đang chạy.
 */
export function DemoSetupOverlay({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            className="glass-panel rounded-2xl px-12 py-10 border border-gold/25 flex flex-col items-center gap-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none" />

            {/* Vòng quay vàng */}
            <div className="relative w-16 h-16">
              <span className="absolute inset-0 rounded-full border-2 border-gold/15" />
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold border-r-gold/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🏇</span>
            </div>

            <div className="text-center">
              <div className="font-serif text-lg text-champagne mb-1.5">
                Đang giả lập dữ liệu giải đấu…
              </div>
              <div className="text-xs text-muted">
                Tạo giải, duyệt 12 ngựa, khám sức khoẻ và ký hợp đồng nài ngựa
              </div>
            </div>

            {/* Ba chấm chạy */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gold"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
