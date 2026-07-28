const ACCENT_RGB = {
  gold: '201, 168, 76',
  emerald: '52, 211, 153',
  blue: '96, 165, 250',
  purple: '167, 139, 250',
  red: '248, 113, 113',
};

const SPARKLES = [
  { top: '14%', left: '32%', size: 10, delay: '0s' },
  { top: '8%', left: '68%', size: 8, delay: '1.2s' },
  { top: '30%', left: '88%', size: 9, delay: '2.4s' },
  { top: '46%', left: '12%', size: 7, delay: '0.8s' },
];

/**
 * Decorative ambient background layer for dashboard pages.
 * Pure decoration: pointer-events-none, sits behind the page's `relative z-10` main.
 */
export function PageAmbience({ accent = 'gold' }) {
  const rgb = ACCENT_RGB[accent];
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent 5%, rgba(201,168,76,0.45), transparent 95%)' }} />

      {/* Gold orb — top right */}
      <div
        className="absolute rounded-full"
        style={{
          top: '-120px',
          right: '-80px',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.14), transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Role-accent orb — bottom left */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-140px',
          left: '-100px',
          width: '420px',
          height: '420px',
          background: `radial-gradient(circle, rgba(${rgb}, 0.12), transparent 65%)`,
          filter: 'blur(70px)',
        }}
      />

      {/* Soft accent wash — center */}
      <div
        className="absolute rounded-full"
        style={{
          top: '38%',
          left: '55%',
          width: '340px',
          height: '340px',
          background: `radial-gradient(circle, rgba(${rgb}, 0.06), transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Fine dot grid, fading toward the bottom */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 60%)',
        }}
      />

      {/* Twinkling star ornaments */}
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animation: `twinkle 4s ease-in-out ${s.delay} infinite`,
          }}
        >
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="#C9A84C" fillOpacity="0.5" />
        </svg>
      ))}
    </div>
  );
}
