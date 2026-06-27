import { Bell, Search } from 'lucide-react';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-glass-border bg-[#0B1628]/90 backdrop-blur-xl flex items-center px-8 justify-between">
      <div className="flex items-center gap-3 bg-white/4 border border-glass-border rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder="Search horses, races, tournaments..."
          className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-muted hover:text-white transition-colors p-2">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
        </button>
        <div className="text-sm text-muted">
          <span className="text-white font-medium">Season 2026</span> • Q3
        </div>
      </div>
    </header>
  );
}
