import { query } from '../config/db.js'

export async function ensureSchema() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(120) NOT NULL,
      username VARCHAR(30) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      email_verified_at TIMESTAMPTZ,
      verification_otp_hash TEXT,
      verification_otp_expires TIMESTAMPTZ,
      verification_attempts INT NOT NULL DEFAULT 0,
      verification_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash TEXT')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMPTZ')
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT
      '{"theme":"dark","language":"en","emailNotifications":true}'::jsonb
  `)
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(80)')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30)')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_hash TEXT')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_expires TIMESTAMPTZ')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INT NOT NULL DEFAULT 0')
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ')
  await query('CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email))')
  await query('CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (lower(username)) WHERE username IS NOT NULL')

  await query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(160) NOT NULL,
      notes TEXT,
      event_date DATE NOT NULL,
      event_type VARCHAR(20) NOT NULL DEFAULT 'other',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS calendar_events_user_date_idx ON calendar_events (user_id, event_date)')

  await query(`
    CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(160),
      content TEXT NOT NULL,
      color VARCHAR(20) NOT NULL DEFAULT 'gold',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS notes_user_idx ON notes (user_id, updated_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      role VARCHAR(20) NOT NULL,
      phone VARCHAR(20),
      deal_note VARCHAR(200),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS contacts_user_idx ON contacts (user_id, created_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      sender VARCHAR(20) NOT NULL DEFAULT 'customer',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS messages_contact_idx ON messages (contact_id, created_at ASC)')

  await query(`
    CREATE TABLE IF NOT EXISTS contractor_companies (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      category VARCHAR(80) NOT NULL,
      team_size INT NOT NULL DEFAULT 0
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS contractor_team_members (
      id VARCHAR(20) PRIMARY KEY,
      contractor_id VARCHAR(10) NOT NULL REFERENCES contractor_companies(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      role VARCHAR(80) NOT NULL,
      experience_years INT NOT NULL,
      rating NUMERIC(2,1) NOT NULL,
      availability VARCHAR(20) NOT NULL
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS contractor_team_members_contractor_idx ON contractor_team_members (contractor_id)')

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seq SERIAL,
      type VARCHAR(20) NOT NULL DEFAULT 'work',
      title VARCHAR(160) NOT NULL,
      project_name VARCHAR(120),
      project_location VARCHAR(120),
      person_name VARCHAR(120),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks (user_id, created_at DESC)')
  await query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description VARCHAR(240)')
  await query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'")

  // Materials marketplace v2 (supplier/inventory/price model). This replaces
  // the old flat material_shops/material_products tables entirely — those
  // baked "shop" and "product" into single rows with no ownership, no price
  // history, and no honest verified/unverified distinction. Dropped, not
  // migrated: no real production orders exist against the old tables yet
  // (this app's backend has never been live in production), so there is no
  // real customer data to preserve here.
  await query('DROP TABLE IF EXISTS material_order_items')
  await query('DROP TABLE IF EXISTS material_orders')
  await query('DROP TABLE IF EXISTS material_products')
  await query('DROP TABLE IF EXISTS material_shops')

  await query(`
    CREATE TABLE IF NOT EXISTS material_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      parent_category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // Postgres unique constraints treat NULL parent_category_id values as
  // always-distinct, so a plain UNIQUE(name, parent_category_id) would never
  // catch duplicate top-level categories — a partial index is needed for
  // that case specifically; non-top-level names are deduped normally.
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS material_categories_top_level_name_idx
      ON material_categories (name) WHERE parent_category_id IS NULL
  `)
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS material_categories_child_name_idx
      ON material_categories (name, parent_category_id) WHERE parent_category_id IS NOT NULL
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS brands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL UNIQUE,
      category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
      subcategory_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
      brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
      description TEXT,
      specification TEXT,
      grade VARCHAR(80),
      unit VARCHAR(40) NOT NULL,
      image_url TEXT,
      image_source TEXT,
      search_keywords TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS materials_category_idx ON materials (category_id)')
  await query('CREATE INDEX IF NOT EXISTS materials_brand_idx ON materials (brand_id)')
  await query(`
    CREATE INDEX IF NOT EXISTS materials_search_idx ON materials
      USING gin (to_tsvector('english', name || ' ' || coalesce(search_keywords, '')))
  `)

  // A supplier is a business, not a login — user_id is only set once someone
  // actually registers/claims it (POST /api/suppliers/register), so admin
  // import or future data-partner ingestion can create supplier rows nobody
  // has claimed yet. verification_status starts 'pending' and is never
  // 'verified' except via an explicit admin action recorded in
  // supplier_verifications below.
  await query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      business_name VARCHAR(200) NOT NULL,
      owner_name VARCHAR(160),
      phone VARCHAR(20),
      whatsapp VARCHAR(20),
      email VARCHAR(160),
      gst_number VARCHAR(20),
      description TEXT,
      supplier_type VARCHAR(60),
      verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      rating NUMERIC(2,1),
      review_count INT NOT NULL DEFAULT 0,
      delivery_available BOOLEAN NOT NULL DEFAULT false,
      delivery_radius_km INT,
      minimum_order_value NUMERIC(12,2),
      source VARCHAR(40) NOT NULL DEFAULT 'registration',
      source_url TEXT,
      imported_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (verification_status IN ('pending', 'verified', 'rejected', 'disabled'))
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS suppliers_user_idx ON suppliers (user_id)')
  await query('CREATE INDEX IF NOT EXISTS suppliers_verification_idx ON suppliers (verification_status)')
  // Lets the demo/seed dataset upsert idempotently by name without needing
  // to fabricate stable UUIDs for it — real registrations (source != 'seed_dataset')
  // are never constrained by this and can freely share a business name.
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS suppliers_seed_business_name_idx
      ON suppliers (business_name) WHERE source = 'seed_dataset'
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      address VARCHAR(240),
      state VARCHAR(80),
      district VARCHAR(80),
      city VARCHAR(80),
      pincode VARCHAR(10),
      latitude NUMERIC(9,6) NOT NULL,
      longitude NUMERIC(9,6) NOT NULL,
      place_id VARCHAR(120),
      is_primary BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_locations_supplier_idx ON supplier_locations (supplier_id)')
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS supplier_locations_primary_idx
      ON supplier_locations (supplier_id) WHERE is_primary = true
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_locations_geo_idx ON supplier_locations (latitude, longitude)')
  await query('CREATE INDEX IF NOT EXISTS supplier_locations_city_idx ON supplier_locations (lower(city))')
  await query('CREATE INDEX IF NOT EXISTS supplier_locations_state_idx ON supplier_locations (lower(state))')
  await query('CREATE INDEX IF NOT EXISTS supplier_locations_pincode_idx ON supplier_locations (pincode)')

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
      brand VARCHAR(120),
      product_name VARCHAR(200),
      specification TEXT,
      grade VARCHAR(80),
      unit VARCHAR(40) NOT NULL,
      minimum_order_quantity INT NOT NULL DEFAULT 1,
      available BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (supplier_id, material_id)
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_materials_supplier_idx ON supplier_materials (supplier_id)')
  await query('CREATE INDEX IF NOT EXISTS supplier_materials_material_idx ON supplier_materials (material_id)')

  // 1:1 with supplier_materials — current stock snapshot only. Never
  // defaults to IN_STOCK: an un-set inventory row means UNKNOWN, not "in
  // stock", so the UI can never imply availability nobody actually reported.
  await query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_material_id UUID NOT NULL UNIQUE REFERENCES supplier_materials(id) ON DELETE CASCADE,
      quantity NUMERIC(12,2),
      stock_status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
      last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source VARCHAR(40) NOT NULL DEFAULT 'seed_dataset',
      verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (stock_status IN ('IN_STOCK', 'LIMITED', 'OUT_OF_STOCK', 'ON_REQUEST', 'UNKNOWN'))
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS inventory_supplier_material_idx ON inventory (supplier_material_id)')

  // Append-only price history: an update closes the current row
  // (valid_until = now()) and inserts a new one, rather than overwriting in
  // place, so "price last updated X ago" is always answerable from real data.
  await query(`
    CREATE TABLE IF NOT EXISTS material_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_material_id UUID NOT NULL REFERENCES supplier_materials(id) ON DELETE CASCADE,
      price NUMERIC(10,2) NOT NULL,
      currency VARCHAR(8) NOT NULL DEFAULT 'INR',
      unit VARCHAR(40) NOT NULL,
      minimum_quantity INT NOT NULL DEFAULT 1,
      bulk_price NUMERIC(10,2),
      gst_included BOOLEAN NOT NULL DEFAULT true,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
      valid_until TIMESTAMPTZ,
      source VARCHAR(40) NOT NULL DEFAULT 'seed_dataset',
      verified BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS material_prices_sm_idx ON material_prices (supplier_material_id, valid_from DESC)')
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS material_prices_current_idx
      ON material_prices (supplier_material_id) WHERE valid_until IS NULL
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_hours (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      opens_at TIME,
      closes_at TIME,
      closed BOOLEAN NOT NULL DEFAULT false,
      UNIQUE (supplier_id, day_of_week)
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_hours_supplier_idx ON supplier_hours (supplier_id)')

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_delivery_zones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      pincode VARCHAR(10),
      city VARCHAR(80),
      radius_km INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_delivery_zones_supplier_idx ON supplier_delivery_zones (supplier_id)')

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (supplier_id, user_id)
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_reviews_supplier_idx ON supplier_reviews (supplier_id, created_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS supplier_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(20) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (status IN ('approved', 'rejected'))
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS supplier_verifications_supplier_idx ON supplier_verifications (supplier_id, created_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS material_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seq SERIAL,
      supplier_id UUID NOT NULL REFERENCES suppliers(id),
      total_amount NUMERIC(12,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'placed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS material_orders_user_idx ON material_orders (user_id, created_at DESC)')
  await query('CREATE INDEX IF NOT EXISTS material_orders_supplier_idx ON material_orders (supplier_id)')

  await query(`
    CREATE TABLE IF NOT EXISTS material_order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES material_orders(id) ON DELETE CASCADE,
      supplier_material_id UUID REFERENCES supplier_materials(id) ON DELETE SET NULL,
      product_name VARCHAR(200) NOT NULL,
      unit VARCHAR(40) NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      quantity INT NOT NULL
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS material_order_items_order_idx ON material_order_items (order_id)')

  // Phase 1 of the multi-role portal: a project is owned by a customer;
  // other roles (supervisor for now, contractor/worker later) are attached
  // to it via project_members rather than a fixed column per role, so later
  // phases can reuse this same table instead of adding more join tables.
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(160) NOT NULL,
      location VARCHAR(160),
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS projects_customer_idx ON projects (customer_id, created_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_on_project VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (project_id, user_id)
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS project_members_user_idx ON project_members (user_id)')
  await query('CREATE INDEX IF NOT EXISTS project_members_project_idx ON project_members (project_id)')

  // Now that projects exists, tasks can optionally be scoped to one (the
  // free-text project_name/project_location columns stay as-is for tasks
  // created outside a formal project).
  await query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL')
  await query('CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id)')

  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percent INT NOT NULL DEFAULT 0')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_completion DATE')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_budget NUMERIC(14,2)')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(40)')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS address VARCHAR(240)')
  await query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT')

  // A progress log entry the customer/supervisor posts against a project.
  // photo_urls is a JSON array of pasted image URLs — there's no file
  // storage configured, so this doesn't pretend to support real uploads.
  await query(`
    CREATE TABLE IF NOT EXISTS project_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      progress_percent INT,
      photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS project_updates_project_idx ON project_updates (project_id, created_at DESC)')

  // Fixed, shared category taxonomy for both budget planning and expense
  // tracking, so the budget-vs-spent chart and the planner bars line up.
  await query(`
    CREATE TABLE IF NOT EXISTS budget_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      category VARCHAR(60) NOT NULL,
      budgeted_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (project_id, category)
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(60) NOT NULL,
      description VARCHAR(200) NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
      payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
      status VARCHAR(20) NOT NULL DEFAULT 'paid',
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS expenses_project_idx ON expenses (project_id, expense_date DESC)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor VARCHAR(120)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(60)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes VARCHAR(500)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subcategory VARCHAR(80)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS material VARCHAR(120)')
  await query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()')

  await query('ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS location VARCHAR(160)')

  // Contractor directory members can optionally be linked to a real login
  // (user_id), so an individual contractor can sign in and see only the
  // projects/tasks they've been assigned to. Most directory rows will stay
  // unlinked — that's fine, they're still assignable for display purposes,
  // just not able to log in until a customer invites them with an email.
  await query('ALTER TABLE contractor_team_members ADD COLUMN IF NOT EXISTS email VARCHAR(255)')
  await query('ALTER TABLE contractor_team_members ADD COLUMN IF NOT EXISTS phone VARCHAR(20)')
  await query('ALTER TABLE contractor_team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL')
  await query('CREATE INDEX IF NOT EXISTS contractor_team_members_user_idx ON contractor_team_members (user_id)')

  // Task assignment: which contractor is doing this task, its own planned
  // schedule, and its own progress — independent of (but able to inform)
  // the project-level progress that project_updates drives.
  await query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_contractor_id VARCHAR(20) REFERENCES contractor_team_members(id) ON DELETE SET NULL')
  await query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE')
  await query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE')
  await query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress_percent INT NOT NULL DEFAULT 0")
  await query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_progress_percent_check')
  await query('ALTER TABLE tasks ADD CONSTRAINT tasks_progress_percent_check CHECK (progress_percent BETWEEN 0 AND 100)')
  await query('CREATE INDEX IF NOT EXISTS tasks_assigned_contractor_idx ON tasks (assigned_contractor_id)')

  // Optional links from a progress update back to the task/contractor it
  // came from, so Task <-> Progress Update can be shown as connected
  // without duplicating any task or contractor data onto project_updates.
  await query('ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL')
  await query('ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(20) REFERENCES contractor_team_members(id) ON DELETE SET NULL')

  // Admin-managed master category list. Project-scoped `budget_categories`
  // keeps its own per-project allocation rows — this table is the shared,
  // orderable taxonomy those rows and expenses.category draw their names
  // from, replacing the hardcoded BUDGET_CATEGORIES array.
  await query(`
    CREATE TABLE IF NOT EXISTS budget_category_defs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(60) NOT NULL UNIQUE,
      description VARCHAR(240),
      parent_category_id UUID REFERENCES budget_category_defs(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  const DEFAULT_BUDGET_CATEGORIES = ['Foundation', 'Structure', 'Electrical', 'Plumbing', 'Finishing', 'Others']
  for (let i = 0; i < DEFAULT_BUDGET_CATEGORIES.length; i++) {
    await query(
      `INSERT INTO budget_category_defs (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [DEFAULT_BUDGET_CATEGORIES[i], i]
    )
  }

  // File metadata for authorization-gated access. The bytes still live on
  // disk (see server/src/middleware/upload.js) but nothing is served by a
  // guessable static URL any more — every read checks this row's project_id
  // against the requester's project membership first.
  await query(`
    CREATE TABLE IF NOT EXISTS project_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind VARCHAR(20) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255),
      mime_type VARCHAR(100) NOT NULL,
      size_bytes INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS project_files_project_idx ON project_files (project_id)')
}
