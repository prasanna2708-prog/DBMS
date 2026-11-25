import { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  IngredientCategory,
  IngredientItem,
  TrieSearchResponse,
} from '../types/recipe.ts';

interface PantryWorkbenchProps {
  allIngredients: IngredientItem[];
  selectedIngredients: string[];
  onToggleIngredient: (name: string) => void;
  onClearAll: () => void;
  onTrieTelemetry: (telemetry: TrieSearchResponse | null) => void;
}

const CATEGORIES: Array<'All' | IngredientCategory> = [
  'All',
  'Vegetables',
  'Meat & Seafood',
  'Lentils & Grains',
  'Spices & Tempering',
  'Aromatics & Herbs',
  'Dairy & Oils',
];

export function PantryWorkbench({
  allIngredients,
  selectedIngredients,
  onToggleIngredient,
  onClearAll,
  onTrieTelemetry,
}: PantryWorkbenchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | IngredientCategory>('All');
  const [trieResults, setTrieResults] = useState<TrieSearchResponse | null>(null);

  const selectedSet = new Set(selectedIngredients.map((s) => s.toLowerCase()));

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setTrieResults(null);
      onTrieTelemetry(null);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/ingredients/suggest?q=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: TrieSearchResponse) => {
        setTrieResults(data);
        onTrieTelemetry(data);
      })
      .catch(() => {
        // Ignore abort errors
      });

    return () => controller.abort();
  }, [query, onTrieTelemetry]);

  const displayedIngredients = query.trim()
    ? trieResults?.suggestions ?? []
    : allIngredients.filter(
        (item) => activeCategory === 'All' || item.category === activeCategory
      );

  return (
    <aside
      aria-label="Pantry ingredient selector"
      className="bg-[#EEF2EB] border border-[#C2CEBC] rounded-lg overflow-hidden lg:sticky lg:top-24"
    >
      <div className="bg-[#166534] px-5 py-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#F4EFE4]">
            Your Pantry
          </h2>
          <p className="text-xs text-[#DCFCE7]/90 mt-0.5">
            Select ingredients on hand to rank Tamil Nadu dishes
          </p>
        </div>
        {selectedIngredients.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-[#FEF08A] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clear ({selectedIngredients.length})
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <label htmlFor="trie-ingredient-search" className="sr-only">
            Search ingredients using Trie prefix lookup
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#5E5A52] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="trie-ingredient-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Prefix search (e.g. tom, gar, dal)..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#FAF9F5] border border-[#C2CEBC] rounded-lg text-[#1E1E1E] placeholder:text-[#5E5A52] focus:outline-none focus:border-[#166534] focus:bg-white transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear ingredient search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5E5A52] hover:text-[#1E1E1E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {trieResults && (
            <div className="flex items-center justify-between text-[11px] text-[#166534] font-mono tabular-nums px-1">
              <span>Trie depth: {trieResults.trieDepth}</span>
              <span>{trieResults.nodesVisited} nodes visited</span>
            </div>
          )}
        </div>

        {!query.trim() && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Ingredient categories">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(category)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#166534] text-[#F4EFE4]'
                      : 'bg-[#DCE5D7] text-[#1E1E1E] hover:bg-[#CDD9C7]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}

        {selectedIngredients.length > 0 && (
          <div className="pt-3 border-t border-[#C2CEBC] space-y-2">
            <div className="text-xs font-medium text-[#14532D]">
              Selected ({selectedIngredients.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {selectedIngredients.map((name) => (
                  <motion.button
                    key={name}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => onToggleIngredient(name)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#166534] text-[#F4EFE4] rounded-lg hover:bg-[#14532D] transition-colors cursor-pointer"
                  >
                    <span>{name}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#C2CEBC]">
          <div className="max-h-[340px] overflow-y-auto pr-1 space-y-1.5">
            {displayedIngredients.length === 0 ? (
              <p className="text-xs text-[#5E5A52] py-6 text-center">
                No ingredients match prefix "{query}".
              </p>
            ) : (
              displayedIngredients.map((item) => {
                const isSelected = selectedSet.has(item.name.toLowerCase());
                return (
                  <motion.button
                    key={item.name}
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onToggleIngredient(item.name)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#DCE8D6] border-[#166534] text-[#14532D]'
                        : 'bg-[#FAF9F5] border-[#C2CEBC] text-[#1E1E1E] hover:border-[#166534]/60 hover:bg-[#E7EDE4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-[#166534] border-[#166534] text-white'
                            : 'border-[#B4C2AD] bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </span>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-[#5E5A52] font-mono tabular-nums shrink-0">
                      {item.recipeCount}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
