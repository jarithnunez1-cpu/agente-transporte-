import { MessageCircle } from 'lucide-react';

export type ActiveTab = 'chat' | 'leads' | 'config';

interface TopBarProps {
  businessName: string;
  brandColor: string;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  leadsCount: number;
  whatsappUrl: string;
}

export function TopBar({
  businessName,
  brandColor,
  activeTab,
  onSelectTab,
  leadsCount,
  whatsappUrl,
}: TopBarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'chat', label: 'Asistente IA' },
    { id: 'leads', label: `Leads (${leadsCount})` },
    { id: 'config', label: 'Conocimiento' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
          style={{ outlineColor: brandColor }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: brandColor }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2">
              <path d="M4 12h11m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 6v12" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {businessName}
          </span>
        </button>

        {/* Zone 2: Clean Single-line Text Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: brandColor }}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Enviar por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <nav
        className="md:hidden flex items-center justify-around border-t border-slate-100 bg-white px-2"
        aria-label="Navegación móvil"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex-1 py-2.5 text-xs font-medium text-center transition-colors whitespace-nowrap tabular-nums ${
                isActive ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5"
                  style={{ backgroundColor: brandColor }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
