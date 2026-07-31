import { motion } from 'framer-motion';

export function PageHero({ title, subtitle, imageUrl, imagePosition = 'right center', badge, actions }) {
  return (
    <div
      className="page-hero-container"
      style={{
        padding: '1px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(181,138,48,0.45) 0%, rgba(181,138,48,0.06) 40%, rgba(181,138,48,0.35) 100%)',
        boxShadow: '0 0 30px rgba(181,138,48,0.10), 0 0 60px rgba(181,138,48,0.05)',
      }}
    >
      {/* Nền lót lúc ảnh chưa tải xong — cùng tông nâu ấm với lớp phủ để không loé
          ra một mảng xanh navy của giao diện tối cũ rồi mới chuyển sang ảnh. */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden relative" style={{ minHeight: '215px', borderRadius: '15px', backgroundColor: '#241C10' }}>
        {/* Lớp ẢNH — tách riêng từng thuộc tính (không dùng shorthand nhiều lớp
             để tránh bị nuốt ảnh), đặt dưới cùng */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${imageUrl}')`,
            backgroundPosition: imagePosition,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Lớp phủ tối: đậm bên trái cho chữ dễ đọc, GẦN TRONG SUỐT bên phải để lộ ảnh.
            Dùng tông nâu đen ấm (#241C10) thay cho navy lạnh của giao diện tối cũ — nền
            sáng hiện tại đi với sắc vàng ấm, phủ màu lạnh lên sẽ lệch tông và tương phản gắt.
            Thêm điểm dừng giữa để chuyển từ vùng tối sang ảnh mềm hơn, không bị gãy khối. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(36,28,16,0.94) 0%, rgba(36,28,16,0.82) 30%, rgba(36,28,16,0.52) 52%, rgba(36,28,16,0.22) 72%, rgba(36,28,16,0.04) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(181,138,48,0.18)',
          }}
        />

        {/* Corner ornaments */}
        <div className="absolute top-3 left-3 pointer-events-none z-20">
          <svg viewBox="0 0 30 30" fill="none" className="w-6 h-6">
            <path d="M0 30V0H30" stroke="#B58A30" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="3" cy="3" r="1.2" fill="#B58A30" fillOpacity="0.7" />
          </svg>
        </div>
        <div className="absolute top-3 right-3 pointer-events-none z-20" style={{ transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 30 30" fill="none" className="w-6 h-6">
            <path d="M0 30V0H30" stroke="#B58A30" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="3" cy="3" r="1.2" fill="#B58A30" fillOpacity="0.7" />
          </svg>
        </div>
        <div className="relative z-10 px-8 py-6 flex flex-col items-start justify-center" style={{ minHeight: '215px' }}>
          {badge && <div className="mb-2">{badge}</div>}
          <h1 className="text-2xl font-serif text-white mb-1">{title}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
          {actions && <div className="flex gap-3 mt-4">{actions}</div>}
        </div>
      </motion.div>
    </div>
  );
}
