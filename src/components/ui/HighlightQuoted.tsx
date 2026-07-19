/**
 * Render text mà các đoạn nằm trong dấu nháy đơn '...' được bỏ nháy và
 * tô đậm + gradient vàng (highlight tên giải/ngựa trong thông báo từ BE).
 * VD: "Tournament 'WC 2026' has been scheduled" → WC 2026 in đậm màu vàng.
 */
export function HighlightQuoted({ text }: { text?: string | null }) {
  const raw = String(text ?? '');
  const parts = raw.split(/'([^'\n]+)'/g);
  if (parts.length === 1) return <>{raw}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="font-bold bg-gradient-to-r from-gold via-champagne to-gold bg-clip-text text-transparent"
          >
            {p}
          </span>
        ) : (
          p
        )
      )}
    </>
  );
}
