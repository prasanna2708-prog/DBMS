import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RecipeDatabase } from './server/db/database.ts';
import { RecipeSearchEngine } from './server/ds/RecipeEngine.ts';
import type { RecipeCategory, SortAlgorithm } from './src/types/recipe.ts';

const PORT = Number(process.env.PORT) || 3000;

const CATEGORY_DEFAULT_IMAGES: Record<RecipeCategory, string> = {
  'Tiffin & Breakfast': '/src/assets/images/dish_tiffin_dosa_1795111276490.jpg',
  'Kuzhambu & Sambar': '/src/assets/images/hero_tamil_spread_1795111275271.jpg',
  'Rasam & Soups': '/src/assets/images/dish_rasam_poriyal_1795111276592.jpg',
  'Variety Rice': '/src/assets/images/dish_pongal_rice_1795111275549.jpg',
  'Poriyal & Kootu': '/src/assets/images/dish_rasam_poriyal_1795111276592.jpg',
  'Chettinad & Roast': '/src/assets/images/dish_chettinad_kuzhambu_1795111276971.jpg',
};

async function startServer() {
  const app = express();
  app.use(express.json());

  const db = new RecipeDatabase();
  const engine = new RecipeSearchEngine();
  engine.rebuild(db.getAllRecipesWithDetails());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      recipeCount: engine.getAllRecipes().length,
      ingredientCount: engine.getAllIngredients().length,
    });
  });

  app.get('/api/ingredients', (_req, res) => {
    res.json({
      ingredients: engine.getAllIngredients(),
    });
  });

  app.get('/api/ingredients/suggest', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const result = engine.suggestIngredients(q);
    res.json(result);
  });

  app.get('/api/recipes', (_req, res) => {
    res.json({
      recipes: engine.getAllRecipes(),
    });
  });

  app.post('/api/recipes/match', (req, res) => {
    const body = req.body as {
      ingredients?: string[];
      algorithm?: SortAlgorithm;
      difficulty?: string;
      maxCookTime?: number;
      category?: string;
    };

    const selectedIngredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    const algorithm: SortAlgorithm =
      body.algorithm === 'quick_sort' || body.algorithm === 'heap_sort'
        ? body.algorithm
        : 'merge_sort';

    const response = engine.matchRecipes(selectedIngredients, algorithm, {
      difficulty: body.difficulty,
      maxCookTime: typeof body.maxCookTime === 'number' ? body.maxCookTime : undefined,
      category: body.category,
    });

    res.json(response);
  });

  app.post('/api/recipes', (req, res) => {
    try {
      const payload = req.body as {
        name?: string;
        tamilName?: string;
        region?: string;
        category?: RecipeCategory;
        difficulty?: 'Easy' | 'Medium' | 'Traditional';
        prepTimeMins?: number;
        cookTimeMins?: number;
        servings?: number;
        wasteSavingTip?: string;
        ingredients?: Array<{
          name: string;
          category:
            | 'Spices & Tempering'
            | 'Lentils & Grains'
            | 'Vegetables'
            | 'Aromatics & Herbs'
            | 'Meat & Seafood'
            | 'Dairy & Oils';
          quantity: string;
          isEssential?: boolean;
          substituteNote?: string;
        }>;
        steps?: string[];
      };

      if (!payload.name?.trim() || !payload.ingredients?.length || !payload.steps?.length) {
        res.status(400).json({ error: 'Recipe name, ingredients, and instructions are required.' });
        return;
      }

      const category: RecipeCategory = payload.category ?? 'Kuzhambu & Sambar';
      const created = db.createRecipe({
        name: payload.name.trim(),
        tamilName: payload.tamilName?.trim() || payload.name.trim(),
        region: payload.region?.trim() || 'Tamil Nadu',
        category,
        difficulty: payload.difficulty ?? 'Medium',
        prepTimeMins: Math.max(1, Number(payload.prepTimeMins) || 10),
        cookTimeMins: Math.max(1, Number(payload.cookTimeMins) || 20),
        servings: Math.max(1, Number(payload.servings) || 3),
        imageUrl: CATEGORY_DEFAULT_IMAGES[category] ?? '/src/assets/images/hero_tamil_spread_1795111275271.jpg',
        wasteSavingTip:
          payload.wasteSavingTip?.trim() ||
          'Use seasonal local vegetables and leftover cooked lentils to minimize kitchen trim waste.',
        ingredients: payload.ingredients.map((ing) => ({
          name: ing.name.trim(),
          category: ing.category,
          quantity: ing.quantity.trim() || 'As needed',
          isEssential: ing.isEssential ?? true,
          substituteNote: ing.substituteNote?.trim() || undefined,
        })),
        steps: payload.steps.filter((s) => s.trim().length > 0),
      });

      engine.rebuild(db.getAllRecipesWithDetails());
      res.status(201).json({ recipe: created });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to create recipe',
      });
    }
  });

  app.delete('/api/recipes/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid recipe ID' });
      return;
    }
    const deleted = db.deleteRecipe(id);
    if (!deleted) {
      res.status(403).json({ error: 'Only user-created recipes can be deleted.' });
      return;
    }
    engine.rebuild(db.getAllRecipesWithDetails());
    res.json({ deleted: true, id });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aduppadi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
