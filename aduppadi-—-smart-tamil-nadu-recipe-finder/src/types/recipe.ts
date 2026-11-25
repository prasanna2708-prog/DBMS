export type DifficultyLevel = 'Easy' | 'Medium' | 'Traditional';

export type RecipeCategory =
  | 'Tiffin & Breakfast'
  | 'Kuzhambu & Sambar'
  | 'Rasam & Soups'
  | 'Variety Rice'
  | 'Poriyal & Kootu'
  | 'Chettinad & Roast';

export type IngredientCategory =
  | 'Spices & Tempering'
  | 'Lentils & Grains'
  | 'Vegetables'
  | 'Aromatics & Herbs'
  | 'Meat & Seafood'
  | 'Dairy & Oils';

export type AvailabilityCategory = 'ready' | 'almost' | 'partial';

export type SortAlgorithm = 'merge_sort' | 'quick_sort' | 'heap_sort';

export interface RecipeIngredient {
  name: string;
  category: IngredientCategory;
  quantity: string;
  isEssential: boolean;
  substituteNote?: string;
}

export interface Recipe {
  id: number;
  slug: string;
  name: string;
  tamilName: string;
  region: string;
  category: RecipeCategory;
  difficulty: DifficultyLevel;
  prepTimeMins: number;
  cookTimeMins: number;
  servings: number;
  imageUrl: string;
  wasteSavingTip: string;
  isCustom: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface RecipeMatchResult {
  recipe: Recipe;
  matchPercentage: number;
  matchedCount: number;
  totalIngredients: number;
  matchedIngredients: string[];
  missingIngredients: RecipeIngredient[];
  availability: AvailabilityCategory;
  pantryUtilizationScore: number;
}

export interface HashBucketPreview {
  ingredient: string;
  recipeIds: number[];
  recipeNames: string[];
}

export interface AlgorithmMetrics {
  algorithmUsed: SortAlgorithm;
  algorithmLabel: string;
  timeComplexity: string;
  totalRecipesInDb: number;
  candidateRecipesEvaluated: number;
  bruteForceChecksAvoided: number;
  pruningEfficiencyPercent: number;
  hashBucketsAccessed: number;
  comparisonsPerformed: number;
  swapsOrMergesPerformed: number;
  executionTimeMicros: number;
  hashBucketSample: HashBucketPreview[];
}

export interface MatchResponse {
  results: RecipeMatchResult[];
  counts: {
    all: number;
    ready: number;
    almost: number;
    partial: number;
  };
  metrics: AlgorithmMetrics;
}

export interface IngredientItem {
  name: string;
  category: IngredientCategory;
  recipeCount: number;
}

export interface TrieSuggestion {
  name: string;
  category: IngredientCategory;
  recipeCount: number;
}

export interface TrieSearchResponse {
  prefix: string;
  suggestions: TrieSuggestion[];
  nodesVisited: number;
  trieDepth: number;
  executionTimeMicros: number;
}

export interface PantryPreset {
  id: string;
  label: string;
  description: string;
  ingredients: string[];
}
