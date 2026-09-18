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

  await query(`
    CREATE TABLE IF NOT EXISTS material_shops (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      category VARCHAR(40) NOT NULL,
      location VARCHAR(120) NOT NULL,
      address VARCHAR(240),
      latitude NUMERIC(9,6),
      longitude NUMERIC(9,6),
      rating NUMERIC(2,1),
      delivery_available BOOLEAN NOT NULL DEFAULT true,
      delivery_eta_hours INT NOT NULL DEFAULT 48
    )
  `)
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS address VARCHAR(240)')
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6)')
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6)')
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1)')
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT true')
  await query('ALTER TABLE material_shops ADD COLUMN IF NOT EXISTS delivery_eta_hours INT NOT NULL DEFAULT 48')

  await query(`
    CREATE TABLE IF NOT EXISTS material_products (
      id VARCHAR(10) PRIMARY KEY,
      shop_id VARCHAR(10) NOT NULL REFERENCES material_shops(id) ON DELETE CASCADE,
      name VARCHAR(160) NOT NULL,
      unit VARCHAR(40) NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      icon VARCHAR(20) NOT NULL DEFAULT 'box',
      image_url TEXT,
      image_source TEXT,
      stock_status VARCHAR(20) NOT NULL DEFAULT 'in_stock'
      ,stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
    )
  `)
  await query('ALTER TABLE material_products ADD COLUMN IF NOT EXISTS image_url TEXT')
  await query('ALTER TABLE material_products ADD COLUMN IF NOT EXISTS image_source TEXT')
  await query("ALTER TABLE material_products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) NOT NULL DEFAULT 'in_stock'")
  await query('ALTER TABLE material_products ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0')
  await query('CREATE INDEX IF NOT EXISTS material_products_shop_idx ON material_products (shop_id)')

  await query(`
    CREATE TABLE IF NOT EXISTS material_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seq SERIAL,
      shop_id VARCHAR(10) NOT NULL REFERENCES material_shops(id),
      total_amount NUMERIC(12,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'placed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query('CREATE INDEX IF NOT EXISTS material_orders_user_idx ON material_orders (user_id, created_at DESC)')

  await query(`
    CREATE TABLE IF NOT EXISTS material_order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES material_orders(id) ON DELETE CASCADE,
      product_name VARCHAR(160) NOT NULL,
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
}
