import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AddRecipeModal } from './components/AddRecipeModal.tsx';
import { Header, type ActiveSection } from './components/Header.tsx';
import { PantryWorkbench } from './components/PantryWorkbench.tsx';
import { RecipeCard } from './components/RecipeCard.tsx';
import { RecipeDetailModal } from './components/RecipeDetailModal.tsx';
import { ZeroWasteSection } from './components/ZeroWasteSection.tsx';
import { LiquidButton } from './components/ui/liquid-glass-button.tsx';
import type {
  AvailabilityCategory,
  IngredientItem,
  MatchResponse,
  PantryPreset,
  Recipe,
  RecipeCategory,
  RecipeMatchResult,
  SortAlgorithm,
} from './types/recipe.ts';

const HERO_BACKGROUND_IMAGE = '/src/assets/images/hero_slate_linen_kitchen_1795112311101.jpg';
const NOOP_TELEMETRY = () => {};

const STARTER_PANTRY = [
  'Tomato',
  'Tamarind',
  'Garlic',
  'Black Peppercorns',
  'Cumin Seeds',
  'Mustard Seeds',
  'Curry Leaves',
  'Turmeric Powder',
  'Asafoetida',
  'Coriander Leaves',
];

const PANTRY_PRESETS: PantryPreset[] = [
  {
    id: 'simple-everyday',
    label: 'Simple 10-Min Staples',
    description: 'Cooked rice, garlic, pepper, ghee & coconut',
    ingredients: [
      'Cooked Rice',
      'Garlic',
      'Black Peppercorns',
      'Ghee',
      'Cumin Seeds',
      'Curry Leaves',
      'Roasted Gram Dal',
      'Grated Coconut',
      'Green Chilli',
      'Mustard Seeds',
    ],
  },
  {
    id: 'rasam-staples',
    label: 'Rasam & Tempering',
    description: 'Pepper, garlic, tamarind & tomatoes',
    ingredients: STARTER_PANTRY,
  },
  {
    id: 'morning-tiffin',
    label: 'Morning Tiffin',
    description: 'Dosa batter, rice, moong dal & coconut',
    ingredients: [
      'Dosa Batter',
      'Grated Coconut',
      'Roasted Gram Dal',
      'Green Chilli',
      'Ginger',
      'Mustard Seeds',
      'Urad Dal',
      'Curry Leaves',
      'Raw Rice',
      'Moong Dal',
      'Ghee',
      'Black Peppercorns',
      'Cumin Seeds',
    ],
  },
  {
    id: 'chettinad-pot',
    label: 'Chettinad Curry',
    description: 'Shallots, brinjal, gingelly oil & spices',
    ingredients: [
      'Brinjal',
      'Shallots',
      'Tomato',
      'Tamarind',
      'Gingelly Oil',
      'Coriander Seeds',
      'Dry Red Chilli',
      'Garlic',
      'Curry Leaves',
      'Mustard Seeds',
      'Fenugreek Seeds',
    ],
  },
  {
    id: 'simple-nonveg',
    label: 'Chicken, Meat & Fish',
    description: 'Chicken, mutton, fish, prawns & Chettinad spices',
    ingredients: [
      'Chicken',
      'Mutton',
      'Fish Fillets',
      'Prawns',
      'Egg',
      'Shallots',
      'Onion',
      'Tomato',
      'Ginger Garlic Paste',
      'Black Peppercorns',
      'Fennel Seeds',
      'Kuzhambu Milagai Thool',
      'Curry Leaves',
      'Gingelly Oil',
      'Turmeric Powder',
    ],
  },
  {
    id: 'leftover-rice',
    label: 'Leftover Rice Rescue',
    description: 'Cooked rice, lemon, curd & tempering',
    ingredients: [
      'Cooked Rice',
      'Lemon',
      'Curd',
      'Gingelly Oil',
      'Mustard Seeds',
      'Urad Dal',
      'Green Chilli',
      'Curry Leaves',
      'Turmeric Powder',
      'Asafoetida',
    ],
  },
];

type AvailabilityFilter = 'all' | AvailabilityCategory;
type CatalogCategoryFilter = 'All' | 'Simple' | 'Meat & Seafood' | RecipeCategory;

const CATALOG_TABS: Array<{ id: CatalogCategoryFilter; label: string }> = [
  { id: 'All', label: 'All Recipes' },
  { id: 'Simple', label: 'Simple (<= 20 min)' },
  { id: 'Meat & Seafood', label: 'Chicken, Meat & Fish' },
  { id: 'Tiffin & Breakfast', label: 'Tiffin & Breakfast' },
  { id: 'Variety Rice', label: 'Variety Rice' },
  { id: 'Kuzhambu & Sambar', label: 'Kuzhambu & Sambar' },
  { id: 'Rasam & Soups', label: 'Rasam & Soups' },
  { id: 'Poriyal & Kootu', label: 'Poriyal & Kootu' },
  { id: 'Chettinad & Roast', label: 'Chettinad & Roast' },
];

function buildMatchResultFromRecipe(recipe: Recipe, pantrySet: Set<string>): RecipeMatchResult {
  const matchedIngredients: string[] = [];
  const missingIngredients = [];

  for (const ing of recipe.ingredients) {
    if (pantrySet.has(ing.name.toLowerCase())) {
      matchedIngredients.push(ing.name);
    } else {
      missingIngredients.push(ing);
    }
  }

  const totalIngredients = recipe.ingredients.length;
  const matchPercentage =
    totalIngredients > 0 ? Math.round((matchedIngredients.length / totalIngredients) * 100) : 0;

  const availability: AvailabilityCategory =
    missingIngredients.length === 0
      ? 'ready'
      : missingIngredients.length <= 2 || matchPercentage >= 65
        ? 'almost'
        : 'partial';

  return {
    recipe,
    matchPercentage,
    matchedCount: matchedIngredients.length,
    totalIngredients,
    matchedIngredients,
    missingIngredients,
    availability,
    pantryUtilizationScore: matchPercentage,
  };
}

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(STARTER_PANTRY);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortAlgorithm, setSortAlgorithm] = useState<SortAlgorithm>('merge_sort');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [maxCookTime, setMaxCookTime] = useState<number>(0);

  const [catalogCategory, setCatalogCategory] = useState<CatalogCategoryFilter>('All');
  const [catalogDifficulty, setCatalogDifficulty] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  const [matchData, setMatchData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMatch, setSelectedMatch] = useState<RecipeMatchResult | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const pantrySet = useMemo(
    () => new Set(selectedIngredients.map((s) => s.toLowerCase())),
    [selectedIngredients]
  );

  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/ingredients');
      const data = await res.json();
      if (Array.isArray(data.ingredients)) {
        setAllIngredients(data.ingredients);
      }
    } catch {
      // Handled gracefully by match state
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      if (Array.isArray(data.recipes)) {
        setAllRecipes(data.recipes);
      }
    } catch {
      // Handled gracefully by match state
    }
  }, []);

  const runMatcher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          algorithm: sortAlgorithm,
          difficulty: difficultyFilter,
          maxCookTime,
        }),
      });
      const data = (await res.json()) as MatchResponse;
      if (!res.ok) {
        throw new Error('Failed to match recipes');
      }
      setMatchData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach recipe server');
    } finally {
      setLoading(false);
    }
  }, [selectedIngredients, sortAlgorithm, difficultyFilter, maxCookTime]);

  useEffect(() => {
    loadIngredients();
    loadCatalog();
  }, [loadIngredients, loadCatalog]);

  useEffect(() => {
    runMatcher();
  }, [runMatcher]);

  const handleToggleIngredient = useCallback((name: string) => {
    setSelectedIngredients((prev) => {
      const lower = name.toLowerCase();
      const exists = prev.some((item) => item.toLowerCase() === lower);
      if (exists) {
        return prev.filter((item) => item.toLowerCase() !== lower);
      }
      return [...prev, name];
    });
  }, []);

  const handleNavigate = useCallback((section: ActiveSection) => {
    setActiveSection(section);
    if (section === 'zero-waste') {
      requestAnimationFrame(() => {
        document.getElementById('zero-waste')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleApplyPreset = useCallback((ingredients: string[]) => {
    setSelectedIngredients(ingredients);
    setAvailabilityFilter('all');
    setDifficultyFilter('All');
    setMaxCookTime(0);
    setActiveSection('finder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteCustomRecipe = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSelectedMatch(null);
          await Promise.all([loadIngredients(), loadCatalog(), runMatcher()]);
        }
      } catch {
        // Ignore transient failure
      }
    },
    [loadIngredients, loadCatalog, runMatcher]
  );

  const visibleResults = useMemo(() => {
    if (!matchData) return [];
    if (availabilityFilter === 'all' || selectedIngredients.length === 0) {
      return matchData.results;
    }
    return matchData.results.filter((item) => item.availability === availabilityFilter);
  }, [matchData, availabilityFilter, selectedIngredients.length]);

  const simpleRecipes = useMemo(() => {
    const source = allRecipes.length > 0 ? allRecipes : matchData?.results.map((r) => r.recipe) ?? [];
    return source
      .filter((r) => r.difficulty === 'Easy' && r.prepTimeMins + r.cookTimeMins <= 20)
      .sort((a, b) => a.prepTimeMins + a.cookTimeMins - (b.prepTimeMins + b.cookTimeMins))
      .slice(0, 6)
      .map((recipe) => buildMatchResultFromRecipe(recipe, pantrySet));
  }, [allRecipes, matchData, pantrySet]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return allRecipes
      .filter((recipe) => {
        if (catalogCategory === 'Simple') {
          if (recipe.difficulty !== 'Easy' || recipe.prepTimeMins + recipe.cookTimeMins > 20) {
            return false;
          }
        } else if (catalogCategory === 'Meat & Seafood') {
          if (!recipe.ingredients.some((ing) => ing.category === 'Meat & Seafood')) {
            return false;
          }
        } else if (catalogCategory !== 'All' && recipe.category !== catalogCategory) {
          return false;
        }
        if (catalogDifficulty !== 'All' && recipe.difficulty !== catalogDifficulty) {
          return false;
        }
        if (q) {
          const matchesText =
            recipe.name.toLowerCase().includes(q) ||
            recipe.tamilName.toLowerCase().includes(q) ||
            recipe.region.toLowerCase().includes(q) ||
            recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
          if (!matchesText) return false;
        }
        return true;
      })
      .map((recipe) => buildMatchResultFromRecipe(recipe, pantrySet));
  }, [allRecipes, catalogCategory, catalogDifficulty, catalogSearch, pantrySet]);

  const activeRecipeInModal = useMemo(() => {
    if (!selectedMatch) return null;
    const fromMatcher = matchData?.results.find((r) => r.recipe.id === selectedMatch.recipe.id);
    if (fromMatcher) return fromMatcher;
    return buildMatchResultFromRecipe(selectedMatch.recipe, pantrySet);
  }, [selectedMatch, matchData, pantrySet]);

  const isHomePage = activeSection === 'home' || activeSection === 'zero-waste';

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen flex flex-col bg-[#E9E4D8] text-[#1E1E1E]">
        <Header
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        <main className="flex-1 w-full">
          {isHomePage && (
            <>
              {/* Full-Bleed Hero Section */}
              <section className="relative w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[600px] flex items-center bg-[#141414] overflow-hidden border-b border-[#2E2E2E]">
                <motion.img
                  src={HERO_BACKGROUND_IMAGE}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/60 to-transparent"
                />

                <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl flex flex-col justify-between gap-7"
                  >
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-[#E9C46A] tracking-wide">
                        Tamil Nadu Culinary Database · Zero-Waste Pantry Engine
                      </p>
                      <h1
                        className="font-display font-semibold text-[#F4EFE4] tracking-tight leading-[1.12]"
                        style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)', textWrap: 'balance' }}
                      >
                        Cook Authentic Tamil Nadu Dishes From What You Already Have
                      </h1>
                      <p className="text-sm sm:text-base text-[#E6E4D7]/95 leading-relaxed max-w-xl">
                        Select ingredients in your kitchen to match traditional and simple everyday
                        Tamil recipes using an Inverted Hash Index, Trie prefix lookup, and ranked
                        missing-item analysis.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <LiquidButton
                        type="button"
                        variant="default"
                        size="lg"
                        onClick={() => handleNavigate('finder')}
                      >
                        <span>Open Recipe Finder</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </LiquidButton>
                      <LiquidButton
                        type="button"
                        variant="dark"
                        size="lg"
                        onClick={() => {
                          setCatalogCategory('Simple');
                          handleNavigate('catalog');
                        }}
                      >
                        <span>Browse Simple Recipes</span>
                      </LiquidButton>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="text-xs font-medium text-[#D8D2C4]">
                        Or jump straight into Recipe Finder with a pantry preset
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PANTRY_PRESETS.map((preset) => (
                          <LiquidButton
                            key={preset.id}
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleApplyPreset(preset.ingredients)}
                          >
                            {preset.label}
                          </LiquidButton>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
                {/* 4-Column Quantitative Proof Strip */}
                <section
                  aria-label="Database summary"
                  className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#C8C0AE] border border-[#C8C0AE] rounded-lg overflow-hidden"
                >
                  <div className="bg-[#E7EDE4] p-4 sm:px-6">
                    <div className="text-xs font-medium text-[#3F4E3B]">Regional Recipes</div>
                    <div className="font-mono text-xl font-semibold text-[#166534] tabular-nums mt-0.5">
                      {allRecipes.length || matchData?.metrics.totalRecipesInDb || 48}
                    </div>
                  </div>
                  <div className="bg-[#F3ECD8] p-4 sm:px-6">
                    <div className="text-xs font-medium text-[#5C4A28]">Indexed Ingredients</div>
                    <div className="font-mono text-xl font-semibold text-[#92400E] tabular-nums mt-0.5">
                      {allIngredients.length || 80}
                    </div>
                  </div>
                  <div className="bg-[#E2EAEB] p-4 sm:px-6">
                    <div className="text-xs font-medium text-[#354F52]">Search Pruning Gain</div>
                    <div className="font-mono text-xl font-semibold text-[#115E59] tabular-nums mt-0.5">
                      {matchData ? `${matchData.metrics.pruningEfficiencyPercent}%` : '—'}
                    </div>
                  </div>
                  <div className="bg-[#F1E5DF] p-4 sm:px-6">
                    <div className="text-xs font-medium text-[#5F3C30]">Engine Execution</div>
                    <div className="font-mono text-xl font-semibold text-[#9A3412] tabular-nums mt-0.5">
                      {matchData ? `${matchData.metrics.executionTimeMicros} µs` : '—'}
                    </div>
                  </div>
                </section>

                {/* Simple Everyday Recipes Spotlight */}
                <section
                  id="simple-recipes"
                  className="bg-[#EAE4D4] border border-[#C8C0AE] rounded-lg p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <p className="text-xs font-semibold text-[#92400E] inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Everyday Simplicity · Under 20 Minutes</span>
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1E1E]">
                        Simple Tamil Recipes for Busy Kitchens
                      </h2>
                      <p className="text-sm text-[#4A463F] leading-relaxed">
                        Quick 5-to-20 minute dishes requiring just a handful of pantry staples—from
                        chutneys, pepper garlic rice, and ragi dosai to chicken rasam, egg podimas,
                        and tawa fish fry.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <LiquidButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCatalogCategory('Simple');
                          handleNavigate('catalog');
                        }}
                      >
                        See All Simple Dishes
                      </LiquidButton>
                      <LiquidButton
                        type="button"
                        variant="dark"
                        size="sm"
                        onClick={() => handleNavigate('finder')}
                      >
                        <span>Match With Pantry</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </LiquidButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {simpleRecipes.map((match, index) => (
                      <RecipeCard
                        key={match.recipe.id}
                        match={match}
                        index={index}
                        hasPantrySelection={false}
                        onSelect={setSelectedMatch}
                      />
                    ))}
                  </div>
                </section>

                {/* Zero-Waste Kitchen Guide */}
                <ZeroWasteSection onApplyPreset={handleApplyPreset} />
              </div>
            </>
          )}

          {activeSection === 'finder' && (
            <>
              {/* Dedicated Recipe Finder Page Banner */}
              <section className="bg-[#E5DFCF] border-b border-[#C8C0AE]">
                <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-7 sm:py-9 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <button
                        type="button"
                        onClick={() => handleNavigate('home')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5A52] hover:text-[#1E1E1E] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Back to Home</span>
                      </button>
                      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1E1E] tracking-tight">
                        Smart Recipe Finder
                      </h1>
                      <p className="text-sm text-[#4A463F] leading-relaxed">
                        Search and select ingredients on hand using our Trie autocomplete and
                        Inverted Hash Index, then rank matching dishes by match %, cook time, or
                        fewest missing items.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs shrink-0 bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg px-4 py-2.5">
                      <div>
                        <div className="text-[#5E5A52]">Selected Pantry</div>
                        <div className="font-mono text-base font-semibold text-[#166534] tabular-nums">
                          {selectedIngredients.length} items
                        </div>
                      </div>
                      <div className="h-7 w-px bg-[#D2CBBB]" aria-hidden="true" />
                      <div>
                        <div className="text-[#5E5A52]">Query Time</div>
                        <div className="font-mono text-base font-semibold text-[#9A3412] tabular-nums">
                          {matchData ? `${matchData.metrics.executionTimeMicros} µs` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-medium text-[#5E5A52] mr-1">
                      Quick presets:
                    </span>
                    {PANTRY_PRESETS.map((preset) => (
                      <LiquidButton
                        key={preset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset(preset.ingredients)}
                      >
                        {preset.label}
                      </LiquidButton>
                    ))}
                  </div>
                </div>
              </section>

              {/* Main Interactive Finder Workbench */}
              <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
                <section id="finder" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-4">
                    <PantryWorkbench
                      allIngredients={allIngredients}
                      selectedIngredients={selectedIngredients}
                      onToggleIngredient={handleToggleIngredient}
                      onClearAll={() => setSelectedIngredients([])}
                      onTrieTelemetry={NOOP_TELEMETRY}
                    />
                  </div>

                  <div className="lg:col-span-8 space-y-6 min-w-0">
                    {/* Availability & Sorting Toolbar */}
                    <div className="bg-[#E5DFCF] border border-[#C8C0AE] rounded-lg p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div
                          className="flex items-center gap-1 p-1 bg-[#D5CEBC] rounded-lg overflow-x-auto"
                          role="tablist"
                          aria-label="Filter recipes by ingredient availability"
                        >
                          {(
                            [
                              { id: 'all', label: 'All Matches', count: matchData?.counts.all ?? 0 },
                              { id: 'ready', label: 'Ready to Cook', count: matchData?.counts.ready ?? 0 },
                              { id: 'almost', label: 'Almost There', count: matchData?.counts.almost ?? 0 },
                              { id: 'partial', label: 'Partial', count: matchData?.counts.partial ?? 0 },
                            ] as const
                          ).map((tab) => {
                            const active = availabilityFilter === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setAvailabilityFilter(tab.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                  active
                                    ? 'bg-[#166534] text-[#F4EFE4]'
                                    : 'text-[#1E1E1E] hover:bg-[#C6BEA9]'
                                }`}
                              >
                                <span>{tab.label}</span>
                                <span
                                  className={`font-mono text-[11px] tabular-nums ${
                                    active ? 'text-[#DCFCE7]' : 'text-[#4A463F]'
                                  }`}
                                >
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label htmlFor="sort-engine" className="text-xs text-[#5E5A52] whitespace-nowrap">
                            Sort via:
                          </label>
                          <select
                            id="sort-engine"
                            value={sortAlgorithm}
                            onChange={(e) => setSortAlgorithm(e.target.value as SortAlgorithm)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#E9E4D8] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E] cursor-pointer"
                          >
                            <option value="merge_sort">Merge Sort (Match %)</option>
                            <option value="quick_sort">Quick Sort (Cook Time)</option>
                            <option value="heap_sort">Heap Sort (Fewest Missing)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D2CBBB] text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label htmlFor="difficulty-select" className="text-[#5E5A52]">
                              Difficulty:
                            </label>
                            <select
                              id="difficulty-select"
                              value={difficultyFilter}
                              onChange={(e) => setDifficultyFilter(e.target.value)}
                              className="px-2.5 py-1 bg-[#E9E4D8] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] cursor-pointer"
                            >
                              <option value="All">All Levels</option>
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Traditional">Traditional</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <label htmlFor="time-select" className="text-[#5E5A52]">
                              Max Time:
                            </label>
                            <select
                              id="time-select"
                              value={maxCookTime}
                              onChange={(e) => setMaxCookTime(Number(e.target.value))}
                              className="px-2.5 py-1 bg-[#E9E4D8] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] cursor-pointer"
                            >
                              <option value={0}>Any Duration</option>
                              <option value={20}>Up to 20 min</option>
                              <option value={30}>Up to 30 min</option>
                              <option value={45}>Up to 45 min</option>
                            </select>
                          </div>
                        </div>

                        {selectedIngredients.length === 0 && (
                          <span className="text-[#5E5A52]">
                            Select pantry items on the left to compute match %
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results State Handling */}
                    {error ? (
                      <div className="bg-[#F4EFE4] border border-[#DC2626]/30 rounded-lg p-8 text-center space-y-3">
                        <p className="text-sm font-medium text-[#DC2626]">{error}</p>
                        <LiquidButton
                          type="button"
                          variant="dark"
                          size="default"
                          onClick={runMatcher}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Query</span>
                        </LiquidButton>
                      </div>
                    ) : loading && !matchData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg p-5 space-y-3 animate-pulse"
                          >
                            <div className="h-3 w-1/2 bg-[#D8D2C4] rounded" />
                            <div className="h-5 w-3/4 bg-[#D8D2C4] rounded" />
                            <div className="h-2 w-full bg-[#D8D2C4] rounded" />
                          </div>
                        ))}
                      </div>
                    ) : visibleResults.length === 0 ? (
                      <div className="bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg p-10 text-center space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="font-display text-lg font-semibold text-[#1E1E1E]">
                            No recipes match this availability filter
                          </h3>
                          <p className="text-sm text-[#5E5A52] max-w-md mx-auto">
                            Try switching to &ldquo;All Matches&rdquo; to see close recipes with 1–2 missing
                            items, or add a few staple spices in your pantry selector.
                          </p>
                        </div>
                        <LiquidButton
                          type="button"
                          variant="dark"
                          size="default"
                          onClick={() => {
                            setAvailabilityFilter('all');
                            setDifficultyFilter('All');
                            setMaxCookTime(0);
                          }}
                        >
                          Show All Matching Recipes
                        </LiquidButton>
                      </div>
                    ) : (
                      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                          {visibleResults.map((match, index) => (
                            <RecipeCard
                              key={match.recipe.id}
                              match={match}
                              index={index}
                              hasPantrySelection={selectedIngredients.length > 0}
                              onSelect={setSelectedMatch}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'catalog' && (
            <>
              {/* Dedicated Full Catalog Page */}
              <section className="bg-[#E5DFCF] border-b border-[#C8C0AE]">
                <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-7 sm:py-9 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <button
                        type="button"
                        onClick={() => handleNavigate('home')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5A52] hover:text-[#1E1E1E] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Back to Home</span>
                      </button>
                      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1E1E] tracking-tight">
                        Full Tamil Nadu Recipe Catalog
                      </h1>
                      <p className="text-sm text-[#4A463F] leading-relaxed">
                        Browse all {allRecipes.length} traditional and simple everyday Tamil Nadu
                        recipes across regional categories, cook times, and difficulty levels.
                      </p>
                    </div>

                    <LiquidButton
                      type="button"
                      variant="dark"
                      size="default"
                      onClick={() => handleNavigate('finder')}
                    >
                      <span>Open Recipe Finder</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </LiquidButton>
                  </div>

                  {/* Catalog Filters */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Recipe categories">
                      {CATALOG_TABS.map((tab) => {
                        const active = catalogCategory === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setCatalogCategory(tab.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? 'bg-[#166534] text-[#F4EFE4]'
                                : 'bg-[#F4EFE4] border border-[#D2CBBB] text-[#1E1E1E] hover:bg-[#DDD5C3]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <div className="relative">
                        <Search
                          className="w-3.5 h-3.5 text-[#5E5A52] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          type="text"
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Search dish, region, or ingredient..."
                          className="pl-8 pr-7 py-1.5 text-xs bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] placeholder:text-[#5E5A52] focus:outline-none focus:border-[#2E2E2E] w-60"
                        />
                        {catalogSearch && (
                          <button
                            type="button"
                            onClick={() => setCatalogSearch('')}
                            aria-label="Clear catalog search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5E5A52] hover:text-[#1E1E1E] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        aria-label="Filter catalog by difficulty"
                        value={catalogDifficulty}
                        onChange={(e) => setCatalogDifficulty(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] cursor-pointer"
                      >
                        <option value="All">All Levels</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Traditional">Traditional</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
                <div className="flex items-center justify-between text-xs text-[#5E5A52]">
                  <span>
                    Showing <span className="font-mono font-semibold text-[#1E1E1E]">{filteredCatalog.length}</span>{' '}
                    of {allRecipes.length} recipes
                  </span>
                  {(catalogCategory !== 'All' || catalogDifficulty !== 'All' || catalogSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogCategory('All');
                        setCatalogDifficulty('All');
                        setCatalogSearch('');
                      }}
                      className="text-[#166534] font-medium hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {filteredCatalog.length === 0 ? (
                  <div className="bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg p-10 text-center space-y-3">
                    <h3 className="font-display text-lg font-semibold text-[#1E1E1E]">
                      No catalog recipes match your search
                    </h3>
                    <p className="text-sm text-[#5E5A52]">
                      Try clearing the search query or switching back to &ldquo;All Recipes&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalog.map((match, index) => (
                      <RecipeCard
                        key={match.recipe.id}
                        match={match}
                        index={index}
                        hasPantrySelection={false}
                        onSelect={setSelectedMatch}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        <footer className="border-t border-[#2E2E2E] bg-[#1E1E1E] text-[#D8D2C4] mt-12">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              Aduppadi — Smart Tamil Nadu Recipe Finder · Powered by SQLite, Inverted Hash Index,
              Trie &amp; Merge/Quick/Heap Sort
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="hover:text-[#F4EFE4] cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('finder')}
                className="hover:text-[#F4EFE4] cursor-pointer"
              >
                Recipe Finder
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('catalog')}
                className="hover:text-[#F4EFE4] cursor-pointer"
              >
                Full Catalog
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('zero-waste')}
                className="hover:text-[#F4EFE4] cursor-pointer"
              >
                Zero-Waste
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="hover:text-[#E9C46A] text-[#E9C46A]/90 font-medium cursor-pointer"
              >
                Add Recipe
              </button>
            </div>
          </div>
        </footer>

        <RecipeDetailModal
          match={activeRecipeInModal}
          pantrySet={pantrySet}
          onClose={() => setSelectedMatch(null)}
          onAddIngredientToPantry={handleToggleIngredient}
          onDeleteCustomRecipe={handleDeleteCustomRecipe}
        />

        <AddRecipeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={async () => {
            await Promise.all([loadIngredients(), loadCatalog(), runMatcher()]);
          }}
        />
      </div>
    </MotionConfig>
  );
}
