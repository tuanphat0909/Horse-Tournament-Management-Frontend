/**
 * Render text mà các đoạn nằm trong dấu nháy đơn '...' được bỏ nháy và
 * highlight (in đậm + nền vàng nhạt) — dùng cho message thông báo từ BE.
 * VD: "Jockey 'Jockey-1' responded 'Accepted'" → Jockey-1 và Accepted được tô nổi.
 */
export function HighlightQuoted({ text }) {
  const raw = String(text ?? '');
  const parts = raw.split(/'([^'\n]+)'/g);
  if (parts.length === 1) return <>{raw}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-bold text-champagne bg-gold/10 border border-gold/20 rounded px-1 py-px mx-0.5">
            {p}
          </span>
        ) : (
          p
        )
      )}
    </>
  );
}
