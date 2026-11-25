import { useEffect } from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Plus, Trash2, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { RecipeMatchResult } from '../types/recipe.ts';
import { RecipeImage } from './RecipeImage.tsx';
import { LiquidButton } from './ui/liquid-glass-button.tsx';

interface RecipeDetailModalProps {
  match: RecipeMatchResult | null;
  pantrySet: Set<string>;
  onClose: () => void;
  onAddIngredientToPantry: (ingredientName: string) => void;
  onDeleteCustomRecipe: (id: number) => void;
}

export function RecipeDetailModal({
  match,
  pantrySet,
  onClose,
  onAddIngredientToPantry,
  onDeleteCustomRecipe,
}: RecipeDetailModalProps) {
  useEffect(() => {
    if (!match) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [match, onClose]);

  const hasPantry = pantrySet.size > 0;

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key="recipe-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/65 p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-modal-title"
          onClick={onClose}
        >
          <motion.div
            key={match.recipe.id}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#F4EFE4] border border-[#D2CBBB] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const { recipe, matchPercentage, missingIngredients, matchedCount } = match;
              const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;
              return (
                <>
                  <div className="sticky top-0 z-10 bg-[#F4EFE4]/95 backdrop-blur-sm px-6 py-4 border-b border-[#D2CBBB] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-[#5E5A52] truncate">
                        {recipe.region} · {recipe.category} · {recipe.difficulty}
                      </p>
                      <h2
                        id="recipe-modal-title"
                        className="font-display text-xl sm:text-2xl font-semibold text-[#1E1E1E] truncate"
                      >
                        {recipe.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close recipe details"
                      className="p-2 rounded-lg text-[#5E5A52] hover:text-[#1E1E1E] hover:bg-[#D8D2C4] transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      <div className="md:col-span-6 aspect-[4/3] rounded-lg overflow-hidden bg-[#D8D2C4]">
                        <RecipeImage
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="md:col-span-6 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <p className="text-sm text-[#5E5A52]">{recipe.tamilName}</p>

                          <div className="grid grid-cols-3 gap-3 py-3 border-y border-[#D2CBBB]">
                            <div>
                              <div className="text-xs text-[#5E5A52]">Total Time</div>
                              <div className="font-mono text-sm font-semibold text-[#1E1E1E] tabular-nums mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#5E5A52]" aria-hidden="true" />
                                {totalTime} min
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#5E5A52]">Servings</div>
                              <div className="font-mono text-sm font-semibold text-[#1E1E1E] tabular-nums mt-0.5 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#5E5A52]" aria-hidden="true" />
                                {recipe.servings}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#5E5A52]">Match</div>
                              <div className="font-mono text-sm font-semibold text-[#166534] tabular-nums mt-0.5">
                                {hasPantry ? `${matchPercentage}%` : `${recipe.ingredients.length} items`}
                              </div>
                            </div>
                          </div>

                          {hasPantry && (
                            <div className="flex items-center gap-2 text-sm">
                              {missingIngredients.length === 0 ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" aria-hidden="true" />
                                  <span className="font-medium text-[#166534]">
                                    Ready to cook — all {recipe.ingredients.length} ingredients are in your pantry
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 text-[#92400E] shrink-0" aria-hidden="true" />
                                  <span className="font-medium text-[#92400E]">
                                    {matchedCount} of {recipe.ingredients.length} available · {missingIngredients.length} missing
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-[#E9E4D8] border border-[#D2CBBB] rounded-lg">
                          <div className="text-xs font-semibold text-[#1E1E1E]">Zero-Waste Kitchen Note</div>
                          <p className="text-sm text-[#5E5A52] mt-1 leading-relaxed">{recipe.wasteSavingTip}</p>
                        </div>
                      </div>
                    </div>

                    <section className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display text-lg font-semibold text-[#1E1E1E]">
                          Ingredients &amp; Substitutions
                        </h3>
                        <span className="text-xs text-[#5E5A52] tabular-nums">
                          Prep {recipe.prepTimeMins}m · Cook {recipe.cookTimeMins}m
                        </span>
                      </div>

                      <div className="divide-y divide-[#D2CBBB] border border-[#D2CBBB] rounded-lg overflow-hidden">
                        {recipe.ingredients.map((ing) => {
                          const inPantry = pantrySet.has(ing.name.toLowerCase());
                          return (
                            <div
                              key={ing.name}
                              className="px-4 py-3 flex items-start justify-between gap-4 bg-[#FAF7F0]"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span
                                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    !hasPantry
                                      ? 'bg-[#D8D2C4] text-[#5E5A52]'
                                      : inPantry
                                        ? 'bg-[#E6ECE1] text-[#166534]'
                                        : 'bg-[#F3E8D2] text-[#92400E]'
                                  }`}
                                  aria-hidden="true"
                                >
                                  {!hasPantry ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5E5A52]" />
                                  ) : inPantry ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-[#1E1E1E]">{ing.name}</span>
                                    <span className="text-xs text-[#5E5A52]">· {ing.quantity}</span>
                                    {hasPantry && (
                                      <span
                                        className={`text-xs font-medium ${
                                          inPantry ? 'text-[#166534]' : 'text-[#92400E]'
                                        }`}
                                      >
                                        {inPantry ? 'In Pantry' : 'Missing'}
                                      </span>
                                    )}
                                  </div>
                                  {!inPantry && ing.substituteNote && (
                                    <p className="text-xs text-[#5E5A52] mt-1">
                                      Smart swap: {ing.substituteNote}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!inPantry && (
                                <LiquidButton
                                  type="button"
                                  variant="dark"
                                  size="sm"
                                  onClick={() => onAddIngredientToPantry(ing.name)}
                                >
                                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Have it</span>
                                </LiquidButton>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="font-display text-lg font-semibold text-[#1E1E1E]">
                        Preparation Steps
                      </h3>
                      <ol className="space-y-3">
                        {recipe.steps.map((step, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-4 p-4 bg-[#E9E4D8] border border-[#D2CBBB] rounded-lg"
                          >
                            <span className="font-mono text-xs font-semibold text-[#2E2E2E] tabular-nums pt-0.5 shrink-0">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <p className="text-sm text-[#1E1E1E] leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </section>

                    {recipe.isCustom && (
                      <div className="pt-4 border-t border-[#D2CBBB] flex items-center justify-between gap-4">
                        <span className="text-xs text-[#5E5A52]">
                          Custom recipe saved in SQLite database
                        </span>
                        <LiquidButton
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteCustomRecipe(recipe.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete Custom Recipe</span>
                        </LiquidButton>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
