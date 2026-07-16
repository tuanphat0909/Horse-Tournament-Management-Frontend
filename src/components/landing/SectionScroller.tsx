import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Two small floating arrow buttons (bottom-right) that jump between the
 * main landing sections. Sections are matched by the `.landing-section`
 * class on the wrappers in HomePage.
 * The up arrow hides at the top of the page; the down arrow hides at the bottom.
 */
const NAV_OFFSET = 80; // fixed navbar height (h-20)
const EDGE_THRESHOLD = 24; // px tolerance to consider "at top / at bottom"

function getSections(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.landing-section'));
}

function currentIndex(sections: HTMLElement[]): number {
  const pos = window.scrollY + NAV_OFFSET + 1;
  let idx = 0;
  sections.forEach((s, i) => {
    if (s.offsetTop <= pos) idx = i;
  });
  return idx;
}

function scrollToSection(el: HTMLElement) {
  window.scrollTo({ top: Math.max(el.offsetTop - NAV_OFFSET, 0), behavior: 'smooth' });
}

export function SectionScroller() {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    function update() {
      setAtTop(window.scrollY <= EDGE_THRESHOLD);
      const doc = document.documentElement;
      setAtBottom(window.innerHeight + window.scrollY >= doc.scrollHeight - EDGE_THRESHOLD);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  function go(dir: -1 | 1) {
    const sections = getSections();
    if (sections.length === 0) return;
    const next = Math.min(Math.max(currentIndex(sections) + dir, 0), sections.length - 1);
    scrollToSection(sections[next]);
  }

  const btnCls =
    'w-9 h-9 rounded-full glass-panel border border-gold/25 flex items-center justify-center ' +
    'text-gold hover:text-champagne hover:border-gold/50 hover:shadow-[0_0_14px_rgba(201,168,76,0.35)] ' +
    'transition-all duration-200 backdrop-blur-md';

  if (atTop && atBottom) return null; // page too short to scroll

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
      {!atTop && (
        <button type="button" aria-label="Previous section" onClick={() => go(-1)} className={btnCls}>
          <ChevronUp size={17} />
        </button>
      )}
      {!atBottom && (
        <button type="button" aria-label="Next section" onClick={() => go(1)} className={btnCls}>
          <ChevronDown size={17} />
        </button>
      )}
    </div>
  );
}
