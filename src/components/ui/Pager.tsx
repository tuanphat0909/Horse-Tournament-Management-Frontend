/* eslint-disable react-refresh/only-export-components */
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Thanh phân trang dùng chung cho mọi danh sách dài.
 * Dùng kèm hook usePaged: const { paged, page, setPage, totalPages } = usePaged(list, 10)
 */
export function Pager({ page, totalPages, onChange, total }: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  total?: number;
}) {
  if (totalPages <= 1) return null;

  // Cửa sổ tối đa 5 số trang quanh trang hiện tại
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const nums: number[] = [];
  for (let n = start; n <= Math.min(totalPages, start + 4); n++) nums.push(n);

  const btn = 'min-w-8 h-8 px-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-glass-border/60">
      <span className="text-[11px] text-muted">
        {total != null ? `${total} items • ` : ''}Page {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className={`${btn} border-glass-border text-muted hover:text-white hover:bg-white/5`}>
          <ChevronLeft size={13} className="mx-auto" />
        </button>
        {nums.map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`${btn} ${n === page
              ? 'border-gold/40 bg-gold/15 text-champagne'
              : 'border-glass-border text-muted hover:text-white hover:bg-white/5'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className={`${btn} border-glass-border text-muted hover:text-white hover:bg-white/5`}>
          <ChevronRight size={13} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}

/** Cắt danh sách theo trang — trả về phần hiển thị + thông tin trang. */
export function paginate<T>(list: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safe = Math.min(Math.max(1, page), totalPages);
  return {
    paged: list.slice((safe - 1) * pageSize, safe * pageSize),
    page: safe,
    totalPages,
    total: list.length,
  };
}
