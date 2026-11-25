import Database from 'better-sqlite3';
import path from 'path';
import type {
  DifficultyLevel,
  IngredientCategory,
  Recipe,
  RecipeCategory,
  RecipeIngredient,
} from '../../src/types/recipe.ts';
import { SEED_RECIPES } from '../data/seedRecipes.ts';

const DB_PATH = path.resolve(process.cwd(), 'aduppadi.db');

export class RecipeDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
    this.syncSeedRecipes();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        tamil_name TEXT NOT NULL,
        region TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        prep_time_mins INTEGER NOT NULL,
        cook_time_mins INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        waste_saving_tip TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        quantity TEXT NOT NULL,
        is_essential INTEGER NOT NULL DEFAULT 1,
        substitute_note TEXT,
        PRIMARY KEY (recipe_id, ingredient_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recipe_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        instruction TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      );
    `);
  }

  private syncSeedRecipes(): void {
    const checkStmt = this.db.prepare('SELECT id FROM recipes WHERE slug = ?');

    const syncAll = this.db.transaction(() => {
      for (const item of SEED_RECIPES) {
        const existing = checkStmt.get(item.slug) as { id: number } | undefined;
        if (!existing) {
          this.insertRecipeInternal({ ...item, isCustom: false });
        }
      }
    });
    syncAll();
  }

  private insertRecipeInternal(input: Omit<Recipe, 'id'>): number {
    const insertRecipeStmt = this.db.prepare(`
      INSERT INTO recipes (
        slug, name, tamil_name, region, category, difficulty,
        prep_time_mins, cook_time_mins, servings, image_url, waste_saving_tip, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertRecipeStmt.run(
      input.slug,
      input.name,
      input.tamilName,
      input.region,
      input.category,
      input.difficulty,
      input.prepTimeMins,
      input.cookTimeMins,
      input.servings,
      input.imageUrl,
      input.wasteSavingTip,
      input.isCustom ? 1 : 0
    );

    const recipeId = Number(info.lastInsertRowid);

    const upsertIngredientStmt = this.db.prepare(`
      INSERT INTO ingredients (name, category) VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET category = excluded.category
      RETURNING id
    `);

    const linkIngredientStmt = this.db.prepare(`
      INSERT OR REPLACE INTO recipe_ingredients (
        recipe_id, ingredient_id, quantity, is_essential, substitute_note
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const ing of input.ingredients) {
      const cleanName = ing.name.trim();
      const row = upsertIngredientStmt.get(cleanName, ing.category) as { id: number };
      linkIngredientStmt.run(
        recipeId,
        row.id,
        ing.quantity.trim(),
        ing.isEssential ? 1 : 0,
        ing.substituteNote ?? null
      );
    }

    const insertStepStmt = this.db.prepare(`
      INSERT INTO recipe_steps (recipe_id, step_number, instruction)
      VALUES (?, ?, ?)
    `);

    input.steps.forEach((step, idx) => {
      insertStepStmt.run(recipeId, idx + 1, step.trim());
    });

    return recipeId;
  }

  getAllRecipesWithDetails(): Recipe[] {
    const recipeRows = this.db
      .prepare('SELECT * FROM recipes ORDER BY is_custom DESC, id ASC')
      .all() as Array<{
      id: number;
      slug: string;
      name: string;
      tamil_name: string;
      region: string;
      category: string;
      difficulty: string;
      prep_time_mins: number;
      cook_time_mins: number;
      servings: number;
      image_url: string;
      waste_saving_tip: string;
      is_custom: number;
    }>;

    const ingStmt = this.db.prepare(`
      SELECT i.name, i.category, ri.quantity, ri.is_essential, ri.substitute_note
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = ?
    `);

    const stepStmt = this.db.prepare(`
      SELECT instruction FROM recipe_steps
      WHERE recipe_id = ?
      ORDER BY step_number ASC
    `);

    return recipeRows.map((row) => {
      const ingRows = ingStmt.all(row.id) as Array<{
        name: string;
        category: string;
        quantity: string;
        is_essential: number;
        substitute_note: string | null;
      }>;

      const stepRows = stepStmt.all(row.id) as Array<{ instruction: string }>;

      const ingredients: RecipeIngredient[] = ingRows.map((r) => ({
        name: r.name,
        category: r.category as IngredientCategory,
        quantity: r.quantity,
        isEssential: r.is_essential === 1,
        substituteNote: r.substitute_note ?? undefined,
      }));

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        tamilName: row.tamil_name,
        region: row.region,
        category: row.category as RecipeCategory,
        difficulty: row.difficulty as DifficultyLevel,
        prepTimeMins: row.prep_time_mins,
        cookTimeMins: row.cook_time_mins,
        servings: row.servings,
        imageUrl: row.image_url,
        wasteSavingTip: row.waste_saving_tip,
        isCustom: row.is_custom === 1,
        ingredients,
        steps: stepRows.map((s) => s.instruction),
      };
    });
  }

  createRecipe(input: Omit<Recipe, 'id' | 'slug' | 'isCustom'>): Recipe {
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug || 'custom-recipe'}-${Date.now()}`;

    const createTx = this.db.transaction(() => {
      return this.insertRecipeInternal({
        ...input,
        slug,
        isCustom: true,
      });
    });

    const newId = createTx();
    const created = this.getAllRecipesWithDetails().find((r) => r.id === newId);
    if (!created) {
      throw new Error('Failed to retrieve newly created recipe');
    }
    return created;
  }

  deleteRecipe(id: number): boolean {
    const row = this.db.prepare('SELECT is_custom FROM recipes WHERE id = ?').get(id) as
      | { is_custom: number }
      | undefined;
    if (!row || row.is_custom !== 1) {
      return false;
    }
    const result = this.db.prepare('DELETE FROM recipes WHERE id = ? AND is_custom = 1').run(id);
    return result.changes > 0;
  }
}
