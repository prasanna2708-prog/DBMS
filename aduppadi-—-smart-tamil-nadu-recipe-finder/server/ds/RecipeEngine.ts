import type {
  AlgorithmMetrics,
  AvailabilityCategory,
  HashBucketPreview,
  IngredientCategory,
  IngredientItem,
  MatchResponse,
  Recipe,
  RecipeIngredient,
  RecipeMatchResult,
  SortAlgorithm,
  TrieSearchResponse,
  TrieSuggestion,
} from '../../src/types/recipe.ts';

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord = false;
  item: TrieSuggestion | null = null;
}

export class IngredientTrie {
  private root: TrieNode = new TrieNode();

  clear(): void {
    this.root = new TrieNode();
  }

  insert(name: string, category: IngredientCategory, recipeCount: number): void {
    const normalized = name.trim().toLowerCase();
    let current = this.root;
    for (const ch of normalized) {
      let next = current.children.get(ch);
      if (!next) {
        next = new TrieNode();
        current.children.set(ch, next);
      }
      current = next;
    }
    current.isEndOfWord = true;
    current.item = { name, category, recipeCount };
  }

  searchPrefix(prefix: string, limit = 10): TrieSearchResponse {
    const start = performance.now();
    const normalized = prefix.trim().toLowerCase();
    let current = this.root;
    let nodesVisited = 1;

    for (const ch of normalized) {
      const next = current.children.get(ch);
      if (!next) {
        return {
          prefix,
          suggestions: [],
          nodesVisited,
          trieDepth: normalized.length,
          executionTimeMicros: Math.max(1, Math.round((performance.now() - start) * 1000)),
        };
      }
      current = next;
      nodesVisited++;
    }

    const suggestions: TrieSuggestion[] = [];
    const dfs = (node: TrieNode) => {
      if (suggestions.length >= limit) return;
      if (node.isEndOfWord && node.item) {
        suggestions.push(node.item);
      }
      const sortedKeys = Array.from(node.children.keys()).sort();
      for (const key of sortedKeys) {
        if (suggestions.length >= limit) break;
        const child = node.children.get(key);
        if (child) {
          nodesVisited++;
          dfs(child);
        }
      }
    };

    dfs(current);

    return {
      prefix,
      suggestions,
      nodesVisited,
      trieDepth: normalized.length,
      executionTimeMicros: Math.max(1, Math.round((performance.now() - start) * 1000)),
    };
  }
}

interface SortStats {
  comparisons: number;
  operations: number;
}

export class RecipeSearchEngine {
  private recipesById: Map<number, Recipe> = new Map();
  private invertedIndex: Map<string, Set<number>> = new Map();
  private ingredientCatalog: Map<string, IngredientItem> = new Map();
  private trie: IngredientTrie = new IngredientTrie();

  rebuild(recipes: Recipe[]): void {
    this.recipesById.clear();
    this.invertedIndex.clear();
    this.ingredientCatalog.clear();
    this.trie.clear();

    for (const recipe of recipes) {
      this.recipesById.set(recipe.id, recipe);
      for (const ing of recipe.ingredients) {
        const key = ing.name.trim().toLowerCase();
        let bucket = this.invertedIndex.get(key);
        if (!bucket) {
          bucket = new Set<number>();
          this.invertedIndex.set(key, bucket);
        }
        bucket.add(recipe.id);

        const existing = this.ingredientCatalog.get(key);
        if (existing) {
          existing.recipeCount = bucket.size;
        } else {
          this.ingredientCatalog.set(key, {
            name: ing.name,
            category: ing.category,
            recipeCount: 1,
          });
        }
      }
    }

    for (const item of this.ingredientCatalog.values()) {
      this.trie.insert(item.name, item.category, item.recipeCount);
    }
  }

  getAllIngredients(): IngredientItem[] {
    return Array.from(this.ingredientCatalog.values()).sort((a, b) => {
      if (b.recipeCount !== a.recipeCount) return b.recipeCount - a.recipeCount;
      return a.name.localeCompare(b.name);
    });
  }

  suggestIngredients(prefix: string): TrieSearchResponse {
    return this.trie.searchPrefix(prefix, 12);
  }

  getAllRecipes(): Recipe[] {
    return Array.from(this.recipesById.values());
  }

  matchRecipes(
    selectedIngredients: string[],
    algorithm: SortAlgorithm = 'merge_sort',
    filters?: {
      difficulty?: string;
      maxCookTime?: number;
      category?: string;
    }
  ): MatchResponse {
    const startTime = performance.now();
    const pantrySet = new Set(
      selectedIngredients.map((s) => s.trim().toLowerCase()).filter(Boolean)
    );

    const totalRecipesInDb = this.recipesById.size;
    const candidateIds = new Set<number>();
    const hashBucketSample: HashBucketPreview[] = [];
    let hashBucketsAccessed = 0;

    if (pantrySet.size > 0) {
      for (const key of pantrySet) {
        hashBucketsAccessed++;
        const bucket = this.invertedIndex.get(key);
        if (bucket) {
          const ids = Array.from(bucket);
          for (const id of ids) {
            candidateIds.add(id);
          }
          if (hashBucketSample.length < 5) {
            hashBucketSample.push({
              ingredient: this.ingredientCatalog.get(key)?.name ?? key,
              recipeIds: ids,
              recipeNames: ids
                .map((id) => this.recipesById.get(id)?.name ?? `Recipe #${id}`)
                .slice(0, 4),
            });
          }
        }
      }
    } else {
      for (const id of this.recipesById.keys()) {
        candidateIds.add(id);
      }
    }

    const matches: RecipeMatchResult[] = [];
    const counts = { all: 0, ready: 0, almost: 0, partial: 0 };

    for (const id of candidateIds) {
      const recipe = this.recipesById.get(id);
      if (!recipe) continue;

      if (filters?.difficulty && filters.difficulty !== 'All' && recipe.difficulty !== filters.difficulty) {
        continue;
      }
      if (filters?.category && filters.category !== 'All' && recipe.category !== filters.category) {
        continue;
      }
      const totalMins = recipe.prepTimeMins + recipe.cookTimeMins;
      if (filters?.maxCookTime && filters.maxCookTime > 0 && totalMins > filters.maxCookTime) {
        continue;
      }

      const matchedIngredients: string[] = [];
      const missingIngredients: RecipeIngredient[] = [];

      for (const ing of recipe.ingredients) {
        const key = ing.name.trim().toLowerCase();
        if (pantrySet.has(key)) {
          matchedIngredients.push(ing.name);
        } else {
          missingIngredients.push(ing);
        }
      }

      const totalIngredients = recipe.ingredients.length;
      const matchPercentage =
        totalIngredients > 0
          ? Math.round((matchedIngredients.length / totalIngredients) * 100)
          : 0;

      if (pantrySet.size > 0 && matchedIngredients.length === 0) {
        continue;
      }

      let availability: AvailabilityCategory = 'partial';
      if (missingIngredients.length === 0 && totalIngredients > 0) {
        availability = 'ready';
      } else if (missingIngredients.length <= 2 || matchPercentage >= 65) {
        availability = 'almost';
      }

      const pantryUtilizationScore =
        pantrySet.size > 0
          ? Math.min(100, Math.round((matchedIngredients.length / pantrySet.size) * 100))
          : 0;

      counts.all++;
      counts[availability]++;

      matches.push({
        recipe,
        matchPercentage,
        matchedCount: matchedIngredients.length,
        totalIngredients,
        matchedIngredients,
        missingIngredients,
        availability,
        pantryUtilizationScore,
      });
    }

    const sortStats: SortStats = { comparisons: 0, operations: 0 };
    let sortedResults: RecipeMatchResult[] = matches;

    if (algorithm === 'merge_sort') {
      sortedResults = this.mergeSort(matches, sortStats);
    } else if (algorithm === 'quick_sort') {
      sortedResults = [...matches];
      this.quickSort(sortedResults, 0, sortedResults.length - 1, sortStats);
    } else {
      sortedResults = [...matches];
      this.heapSort(sortedResults, sortStats);
    }

    const bruteForceOps = totalRecipesInDb * Math.max(1, pantrySet.size);
    const evaluated = candidateIds.size;
    const avoided = Math.max(0, totalRecipesInDb - evaluated);
    const pruningEfficiencyPercent =
      totalRecipesInDb > 0 && pantrySet.size > 0
        ? Math.round((avoided / totalRecipesInDb) * 100)
        : 0;

    const algorithmMeta: Record<SortAlgorithm, { label: string; complexity: string }> = {
      merge_sort: {
        label: 'Merge Sort (Match % Desc)',
        complexity: 'O(k log k) stable',
      },
      quick_sort: {
        label: 'Quick Sort (Cook Time Asc)',
        complexity: 'O(k log k) in-place',
      },
      heap_sort: {
        label: 'Heap Sort (Fewest Missing)',
        complexity: 'O(k log k) priority',
      },
    };

    const metrics: AlgorithmMetrics = {
      algorithmUsed: algorithm,
      algorithmLabel: algorithmMeta[algorithm].label,
      timeComplexity: algorithmMeta[algorithm].complexity,
      totalRecipesInDb,
      candidateRecipesEvaluated: evaluated,
      bruteForceChecksAvoided: Math.max(0, bruteForceOps - evaluated),
      pruningEfficiencyPercent,
      hashBucketsAccessed,
      comparisonsPerformed: sortStats.comparisons,
      swapsOrMergesPerformed: sortStats.operations,
      executionTimeMicros: Math.max(1, Math.round((performance.now() - startTime) * 1000)),
      hashBucketSample,
    };

    return {
      results: sortedResults,
      counts,
      metrics,
    };
  }

  // Merge Sort: prioritizes highest match percentage, then fewest missing, then shortest cook time
  private compareByMatch(a: RecipeMatchResult, b: RecipeMatchResult): number {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    if (a.missingIngredients.length !== b.missingIngredients.length) {
      return a.missingIngredients.length - b.missingIngredients.length;
    }
    return (
      a.recipe.prepTimeMins +
      a.recipe.cookTimeMins -
      (b.recipe.prepTimeMins + b.recipe.cookTimeMins)
    );
  }

  private mergeSort(arr: RecipeMatchResult[], stats: SortStats): RecipeMatchResult[] {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid), stats);
    const right = this.mergeSort(arr.slice(mid), stats);
    return this.merge(left, right, stats);
  }

  private merge(
    left: RecipeMatchResult[],
    right: RecipeMatchResult[],
    stats: SortStats
  ): RecipeMatchResult[] {
    const merged: RecipeMatchResult[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      stats.comparisons++;
      stats.operations++;
      if (this.compareByMatch(left[i], right[j]) <= 0) {
        merged.push(left[i++]);
      } else {
        merged.push(right[j++]);
      }
    }

    while (i < left.length) {
      stats.operations++;
      merged.push(left[i++]);
    }
    while (j < right.length) {
      stats.operations++;
      merged.push(right[j++]);
    }
    return merged;
  }

  // Quick Sort: prioritizes fastest total cooking time, tie-breaking by match percentage
  private compareByCookTime(a: RecipeMatchResult, b: RecipeMatchResult): number {
    const timeA = a.recipe.prepTimeMins + a.recipe.cookTimeMins;
    const timeB = b.recipe.prepTimeMins + b.recipe.cookTimeMins;
    if (timeA !== timeB) return timeA - timeB;
    return b.matchPercentage - a.matchPercentage;
  }

  private quickSort(
    arr: RecipeMatchResult[],
    low: number,
    high: number,
    stats: SortStats
  ): void {
    if (low < high) {
      const pivotIndex = this.partition(arr, low, high, stats);
      this.quickSort(arr, low, pivotIndex - 1, stats);
      this.quickSort(arr, pivotIndex + 1, high, stats);
    }
  }

  private partition(
    arr: RecipeMatchResult[],
    low: number,
    high: number,
    stats: SortStats
  ): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      stats.comparisons++;
      if (this.compareByCookTime(arr[j], pivot) <= 0) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          stats.operations++;
        }
      }
    }
    if (i + 1 !== high) {
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      stats.operations++;
    }
    return i + 1;
  }

  // Heap Sort: prioritizes fewest missing ingredients, then highest match percentage
  private compareByMissing(a: RecipeMatchResult, b: RecipeMatchResult): number {
    if (a.missingIngredients.length !== b.missingIngredients.length) {
      return a.missingIngredients.length - b.missingIngredients.length;
    }
    return b.matchPercentage - a.matchPercentage;
  }

  private heapSort(arr: RecipeMatchResult[], stats: SortStats): void {
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(arr, n, i, stats);
    }
    for (let i = n - 1; i > 0; i--) {
      [arr[0], arr[i]] = [arr[i], arr[0]];
      stats.operations++;
      this.heapify(arr, i, 0, stats);
    }
  }

  private heapify(
    arr: RecipeMatchResult[],
    n: number,
    i: number,
    stats: SortStats
  ): void {
    let extreme = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n) {
      stats.comparisons++;
      if (this.compareByMissing(arr[left], arr[extreme]) > 0) {
        extreme = left;
      }
    }
    if (right < n) {
      stats.comparisons++;
      if (this.compareByMissing(arr[right], arr[extreme]) > 0) {
        extreme = right;
      }
    }
    if (extreme !== i) {
      [arr[i], arr[extreme]] = [arr[extreme], arr[i]];
      stats.operations++;
      this.heapify(arr, n, extreme, stats);
    }
  }
}
