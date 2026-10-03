import BudgetCategoryDef from '../models/BudgetCategoryDef.js'
import { uuidId } from '../models/_shared.js'

// Mirrors the Postgres `ensureSchema.js` seed exactly — the admin-managed
// master category list customer expense/budget forms draw from. Without
// this, a fresh database has zero active categories and every expense or
// budget-set call fails "Unknown category" / "Choose a valid category".
const DEFAULT_BUDGET_CATEGORIES = ['Foundation', 'Structure', 'Electrical', 'Plumbing', 'Finishing', 'Others']

export async function seedBudgetCategoriesMongo() {
  for (let i = 0; i < DEFAULT_BUDGET_CATEGORIES.length; i++) {
    await BudgetCategoryDef.updateOne(
      { name: DEFAULT_BUDGET_CATEGORIES[i] },
      { $setOnInsert: { _id: uuidId(), sort_order: i } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${DEFAULT_BUDGET_CATEGORIES.length} default budget categories (MongoDB)`)
}
