import { motion } from 'framer-motion';

/**
 * Logo thương hiệu EQUESTRIA — ảnh ngựa vàng sang trọng + hiệu ứng chuyển động
 * đồng bộ phong cách app (framer-motion): xuất hiện dạng spring, bay nhẹ liên tục,
 * quầng sáng vàng pulse, hover phóng to.
 *
 * `size` = CHIỀU CAO của ảnh logo. Khi bật `plate`, logo nằm trên một nền
 * "medallion" màu navy đậm (nền của trang) để phần vàng nổi bật trên mọi theme.
 */
const LOGO_SRC = '/images/luxury_sparkling_gold_horse_logo-removebg-preview.png';
// Màu nền tối của trang (var(--color-navy) ở theme mặc định) — cố định để logo
// vàng luôn nổi bật kể cả khi trang đang ở theme sáng.
const PLATE_BG = '#0B1628';

interface BrandLogoProps {
  /** Chiều cao (px) của ảnh logo. Mặc định 48. */
  size?: number;
  /** Quầng sáng vàng phía sau. Mặc định true. */
  glow?: boolean;
  /** Nền medallion navy phía sau logo để làm nổi phần vàng. Mặc định false (logo trong suốt). */
  plate?: boolean;
  className?: string;
}

export function BrandLogo({ size = 48, glow = true, plate = false, className = '' }: BrandLogoProps) {
  const pad = Math.round(size * 0.16);
  return (
    <motion.span
      className={`relative inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      whileHover={{ scale: 1.1, rotate: 2 }}
      whileTap={{ scale: 0.94 }}
    >
      {glow && (
        <motion.span
          aria-hidden
          className="absolute z-0 pointer-events-none"
          style={{ inset: '-22%', background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.5) 0%, transparent 62%)' }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.85, 1.12, 0.85] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className="relative z-10 inline-flex items-center justify-center"
        style={
          plate
            ? {
                padding: pad,
                borderRadius: '9999px',
                background: PLATE_BG,
                boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.28), 0 4px 14px rgba(0,0,0,0.35)',
              }
            : undefined
        }
      >
        <motion.img
          src={LOGO_SRC}
          alt="EQUESTRIA"
          draggable={false}
          className="block w-auto object-contain select-none pointer-events-none"
          style={{ height: size, filter: 'drop-shadow(0 2px 6px rgba(212,175,55,0.4))' }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
    </motion.span>
  );
}
