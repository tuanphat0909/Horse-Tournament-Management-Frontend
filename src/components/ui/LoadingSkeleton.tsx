/**
 * Skeleton loader dùng chung — thay cho chữ "Loading..." trơ trọi.
 * Vẽ các khối giữ chỗ đúng nhịp danh sách/bảng, mờ dần về cuối,
 * vệt sáng quét qua (animation .skeleton định nghĩa ở index.css).
 *
 *   <LoadingSkeleton />              → 4 hàng cao 56px (danh sách card)
 *   <LoadingSkeleton rows={6} h="h-10" /> → 6 hàng thấp (bảng)
 */
export function LoadingSkeleton({ rows = 4, h = 'h-14', className = '' }: { rows?: number; h?: string; className?: string }) {
  return (
    <div className={`space-y-3 py-2 ${className}`} aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton ${h} rounded-xl`} style={{ opacity: 1 - i * 0.18 }} />
      ))}
    </div>
  );
}
