import { Plus } from 'lucide-react';
import { LiquidButton } from './ui/liquid-glass-button.tsx';

export type ActiveSection = 'home' | 'finder' | 'catalog' | 'zero-waste';

interface HeaderProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  onOpenAddModal: () => void;
}

const NAV_ITEMS: Array<{ id: ActiveSection; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'finder', label: 'Recipe Finder' },
  { id: 'catalog', label: 'Full Catalog' },
  { id: 'zero-waste', label: 'Zero-Waste' },
];

export function Header({ activeSection, onNavigate, onOpenAddModal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F4EFE4]/95 backdrop-blur-sm border-b border-[#D2CBBB]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl font-semibold tracking-tight text-[#1E1E1E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E2E2E]"
        >
          Aduppadi
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E5A52]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors duration-150 border-b-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E2E2E] ${
                  isActive
                    ? 'text-[#1E1E1E] border-[#2E2E2E]'
                    : 'border-transparent hover:text-[#1E1E1E] hover:border-[#CFC8B8]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <LiquidButton
            type="button"
            variant="dark"
            size="default"
            onClick={onOpenAddModal}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Recipe</span>
          </LiquidButton>
        </div>
      </div>

      <div className="md:hidden border-t border-[#D2CBBB] px-4 py-1.5 flex items-center gap-4 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`py-1.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 ${
                isActive ? 'text-[#1E1E1E] border-[#2E2E2E]' : 'text-[#5E5A52] border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
