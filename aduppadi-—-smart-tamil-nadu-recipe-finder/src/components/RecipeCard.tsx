import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { RecipeMatchResult } from '../types/recipe.ts';

interface RecipeCardProps {
  match: RecipeMatchResult;
  hasPantrySelection: boolean;
  index: number;
  onSelect: (match: RecipeMatchResult) => void;
}

export function RecipeCard({ match, hasPantrySelection, index, onSelect }: RecipeCardProps) {
  const { recipe, matchPercentage, matchedIngredients, missingIngredients, availability } = match;
  const totalTime = recipe.prepTimeMins + recipe.cookTimeMins;

  const statusMeta = !hasPantrySelection
    ? {
        label: 'Catalog',
        cardBg: 'bg-[#F4EFE4] border-[#D2CBBB] hover:border-[#5E5A52]',
        trayBg: 'bg-[#EDE6D6] border-[#D2CBBB]',
        textClass: 'text-[#1E1E1E]',
        barClass: 'bg-[#2E2E2E]',
        Icon: CheckCircle2,
      }
    : availability === 'ready'
      ? {
          label: 'Ready to Cook',
          cardBg: 'bg-[#EEF3EB] border-[#B7CCB0] hover:border-[#166534]',
          trayBg: 'bg-[#E4ECE0] border-[#B7CCB0]',
          textClass: 'text-[#166534]',
          barClass: 'bg-[#166534]',
          Icon: CheckCircle2,
        }
      : availability === 'almost'
        ? {
            label: `${missingIngredients.length} ${missingIngredients.length === 1 ? 'item' : 'items'} missing`,
            cardBg: 'bg-[#F6EFE0] border-[#DEC89A] hover:border-[#B45309]',
            trayBg: 'bg-[#EFE4CC] border-[#DEC89A]',
            textClass: 'text-[#92400E]',
            barClass: 'bg-[#B45309]',
            Icon: AlertCircle,
          }
        : {
            label: `${missingIngredients.length} items missing`,
            cardBg: 'bg-[#F4EAE6] border-[#DFC0B6] hover:border-[#9A3412]',
            trayBg: 'bg-[#ECDDD7] border-[#DFC0B6]',
            textClass: 'text-[#9A3412]',
            barClass: 'bg-[#DC2626]',
            Icon: AlertCircle,
          };

  const StatusIcon = statusMeta.Icon;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.2, delay: Math.min(index * 0.025, 0.18) },
        y: { duration: 0.22, delay: Math.min(index * 0.025, 0.18), ease: [0.16, 1, 0.3, 1] },
      }}
      whileHover={{ y: -2 }}
      className={`group border rounded-lg overflow-hidden flex flex-col transition-colors duration-150 ${statusMeta.cardBg}`}
    >
      <button
        type="button"
        onClick={() => onSelect(match)}
        className="text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2E2E2E]"
      >
        <div className="flex-1 flex flex-col justify-between">
          <div className="p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-xs text-[#5E5A52]">
              <div className="flex items-center gap-1.5 truncate">
                <span>{recipe.region}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {totalTime} min
                </span>
                <span aria-hidden="true">·</span>
                <span>{recipe.difficulty}</span>
              </div>
              {recipe.isCustom && (
                <span className="text-[#1E1E1E] font-medium shrink-0">Added</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#1E1E1E] leading-snug">
                  {recipe.name}
                </h3>
                <p className="text-xs text-[#5E5A52] mt-0.5">{recipe.tamilName}</p>
              </div>
              {hasPantrySelection && (
                <div className="text-right shrink-0">
                  <div className={`font-mono text-base font-semibold tabular-nums ${statusMeta.textClass}`}>
                    {matchPercentage}%
                  </div>
                  <div className="text-[11px] text-[#5E5A52]">match</div>
                </div>
              )}
            </div>

            {hasPantrySelection && (
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1.5 bg-[#D8D2C4] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.04, matchPercentage / 100) }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full w-full origin-left rounded-full ${statusMeta.barClass}`}
                  />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}>
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{statusMeta.label}</span>
                  <span className="text-[#5E5A52] font-normal tabular-nums">
                    ({matchedIngredients.length}/{recipe.ingredients.length} ingredients)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={`px-5 py-3.5 border-t space-y-1.5 text-xs ${statusMeta.trayBg}`}>
            {hasPantrySelection ? (
              <>
                {matchedIngredients.length > 0 && (
                  <p className="text-[#1E1E1E] line-clamp-1">
                    <span className="font-medium text-[#166534]">Have:</span>{' '}
                    {matchedIngredients.join(', ')}
                  </p>
                )}
                {missingIngredients.length > 0 ? (
                  <p className="text-[#5E5A52] line-clamp-1">
                    <span className="font-medium text-[#92400E]">Missing:</span>{' '}
                    {missingIngredients.map((m) => m.name).join(', ')}
                  </p>
                ) : (
                  <p className="text-[#166534] font-medium">
                    All {recipe.ingredients.length} ingredients ready in your pantry
                  </p>
                )}
              </>
            ) : (
              <p className="text-[#5E5A52] line-clamp-2">
                <span className="font-medium text-[#1E1E1E]">Key ingredients:</span>{' '}
                {recipe.ingredients.slice(0, 5).map((i) => i.name).join(', ')}
                {recipe.ingredients.length > 5 ? ` +${recipe.ingredients.length - 5} more` : ''}
              </p>
            )}
          </div>
        </div>
      </button>
    </motion.article>
  );
}
