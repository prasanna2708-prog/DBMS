import { useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  DifficultyLevel,
  IngredientCategory,
  Recipe,
  RecipeCategory,
} from '../types/recipe.ts';
import { LiquidButton } from './ui/liquid-glass-button.tsx';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (recipe: Recipe) => void;
}

interface IngredientDraft {
  name: string;
  category: IngredientCategory;
  quantity: string;
  substituteNote: string;
}

const RECIPE_CATEGORIES: RecipeCategory[] = [
  'Kuzhambu & Sambar',
  'Tiffin & Breakfast',
  'Rasam & Soups',
  'Variety Rice',
  'Poriyal & Kootu',
  'Chettinad & Roast',
];

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Vegetables',
  'Meat & Seafood',
  'Lentils & Grains',
  'Spices & Tempering',
  'Aromatics & Herbs',
  'Dairy & Oils',
];

export function AddRecipeModal({ isOpen, onClose, onCreated }: AddRecipeModalProps) {
  const [name, setName] = useState('');
  const [tamilName, setTamilName] = useState('');
  const [region, setRegion] = useState('Chettinad');
  const [category, setCategory] = useState<RecipeCategory>('Kuzhambu & Sambar');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [prepTimeMins, setPrepTimeMins] = useState(10);
  const [cookTimeMins, setCookTimeMins] = useState(20);
  const [servings, setServings] = useState(3);
  const [wasteSavingTip, setWasteSavingTip] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', category: 'Vegetables', quantity: '1 cup', substituteNote: '' },
    { name: '', category: 'Spices & Tempering', quantity: '1 tsp', substituteNote: '' },
  ]);
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validIngredients = ingredients.filter((i) => i.name.trim().length > 0);
    const validSteps = steps.filter((s) => s.trim().length > 0);

    if (!name.trim() || validIngredients.length === 0 || validSteps.length === 0) {
      setError('Please enter a recipe name, at least one ingredient, and one step.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tamilName,
          region,
          category,
          difficulty,
          prepTimeMins,
          cookTimeMins,
          servings,
          wasteSavingTip,
          ingredients: validIngredients,
          steps: validSteps,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save recipe');
      }
      onCreated(data.recipe);
      setName('');
      setTamilName('');
      setWasteSavingTip('');
      setIngredients([
        { name: '', category: 'Vegetables', quantity: '1 cup', substituteNote: '' },
        { name: '', category: 'Spices & Tempering', quantity: '1 tsp', substituteNote: '' },
      ]);
      setSteps(['', '']);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-recipe-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/65 p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-recipe-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="sticky top-0 z-10 bg-[#F4EFE4] px-6 py-4 border-b border-[#D2CBBB] flex items-center justify-between gap-4">
          <div>
            <h2 id="add-recipe-title" className="font-display text-xl font-semibold text-[#1E1E1E]">
              Add Tamil Nadu Recipe
            </h2>
            <p className="text-xs text-[#5E5A52]">
              Saved to SQLite and automatically indexed into the Hash Map and Trie
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-[#5E5A52] hover:text-[#1E1E1E] hover:bg-[#D8D2C4] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-[#FEE2E2]/80 border border-[#DC2626]/30 rounded-lg text-xs font-medium text-[#DC2626]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="recipe-name" className="text-xs font-medium text-[#1E1E1E]">
                Dish Name
              </label>
              <input
                id="recipe-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kathirikai Podi Curry"
                className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipe-tamil" className="text-xs font-medium text-[#1E1E1E]">
                Tamil Name (Optional)
              </label>
              <input
                id="recipe-tamil"
                type="text"
                value={tamilName}
                onChange={(e) => setTamilName(e.target.value)}
                placeholder="e.g. கத்திரிக்காய் பொடி கறி"
                className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipe-region" className="text-xs font-medium text-[#1E1E1E]">
                Region
              </label>
              <input
                id="recipe-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Madurai, Thanjavur"
                className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipe-category" className="text-xs font-medium text-[#1E1E1E]">
                Category
              </label>
              <select
                id="recipe-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
              >
                {RECIPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div className="space-y-1.5">
                <label htmlFor="recipe-difficulty" className="text-xs font-medium text-[#1E1E1E]">
                  Difficulty
                </label>
                <select
                  id="recipe-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Traditional">Traditional</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="recipe-prep" className="text-xs font-medium text-[#1E1E1E]">
                  Prep (mins)
                </label>
                <input
                  id="recipe-prep"
                  type="number"
                  min={1}
                  value={prepTimeMins}
                  onChange={(e) => setPrepTimeMins(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] tabular-nums focus:outline-none focus:border-[#2E2E2E]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="recipe-cook" className="text-xs font-medium text-[#1E1E1E]">
                  Cook (mins)
                </label>
                <input
                  id="recipe-cook"
                  type="number"
                  min={1}
                  value={cookTimeMins}
                  onChange={(e) => setCookTimeMins(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] tabular-nums focus:outline-none focus:border-[#2E2E2E]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E1E1E]">Ingredients</span>
              <button
                type="button"
                onClick={() =>
                  setIngredients((prev) => [
                    ...prev,
                    { name: '', category: 'Vegetables', quantity: '1 tbsp', substituteNote: '' },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2E2E2E] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setIngredients(next);
                    }}
                    placeholder="Ingredient (e.g. Brinjal)"
                    className="col-span-5 px-2.5 py-2 text-xs bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = {
                        ...next[idx],
                        category: e.target.value as IngredientCategory,
                      };
                      setIngredients(next);
                    }}
                    className="col-span-4 px-2 py-2 text-xs bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
                  >
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = { ...next[idx], quantity: e.target.value };
                      setIngredients(next);
                    }}
                    placeholder="Qty"
                    className="col-span-2 px-2 py-2 text-xs bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients((prev) =>
                        prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                      )
                    }
                    aria-label="Remove ingredient"
                    className="col-span-1 p-2 text-[#5E5A52] hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E1E1E]">Cooking Steps</span>
              <button
                type="button"
                onClick={() => setSteps((prev) => [...prev, ''])}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2E2E2E] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#5E5A52] w-5 shrink-0 tabular-nums">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const next = [...steps];
                      next[idx] = e.target.value;
                      setSteps(next);
                    }}
                    placeholder={`Step ${idx + 1} instruction`}
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="waste-tip" className="text-xs font-medium text-[#1E1E1E]">
              Zero-Waste Kitchen Tip
            </label>
            <input
              id="waste-tip"
              type="text"
              value={wasteSavingTip}
              onChange={(e) => setWasteSavingTip(e.target.value)}
              placeholder="e.g. Uses wilted curry leaves or leftover dal water"
              className="w-full px-3 py-2 text-sm bg-[#FAF7F0] border border-[#D2CBBB] rounded-lg text-[#1E1E1E] focus:outline-none focus:border-[#2E2E2E]"
            />
          </div>

          <div className="pt-4 border-t border-[#D2CBBB] flex items-center justify-end gap-3">
            <LiquidButton
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
            >
              Cancel
            </LiquidButton>
            <LiquidButton
              type="submit"
              variant="dark"
              size="default"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Recipe'}
            </LiquidButton>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
