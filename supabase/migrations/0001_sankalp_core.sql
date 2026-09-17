create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  phone text,
  role text not null default 'customer' check (role in ('customer','contractor','site_engineer','project_manager','admin')),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  state text,
  city text,
  area text,
  pincode text,
  latitude double precision,
  longitude double precision,
  point geography(point, 4326),
  created_at timestamptz not null default now()
);
create index if not exists locations_point_idx on public.locations using gist(point);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, location_id uuid references public.locations(id), status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member', created_at timestamptz not null default now(), primary key (project_id, user_id)
);

create table if not exists public.material_categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(), category_id uuid references public.material_categories(id), name text not null,
  description text, image_url text, unit text not null, price numeric(12,2) not null check (price >= 0),
  availability boolean not null default true, stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(), shop_name text not null, address text, city text, state text, pincode text,
  location_id uuid references public.locations(id), phone text, rating numeric(2,1) check (rating between 0 and 5),
  verified boolean not null default false, delivery_available boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.shop_materials (
  shop_id uuid references public.shops(id) on delete cascade, material_id uuid references public.materials(id) on delete cascade,
  price numeric(12,2) not null check (price >= 0), stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (shop_id, material_id)
);
create index if not exists shop_materials_material_idx on public.shop_materials(material_id);

create table if not exists public.cart (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cart_items (
  cart_id uuid references public.cart(id) on delete cascade, shop_id uuid not null references public.shops(id), material_id uuid not null references public.materials(id),
  quantity integer not null check (quantity > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (cart_id, shop_id, material_id)
);
create table if not exists public.material_orders (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), shop_id uuid not null references public.shops(id),
  delivery_address jsonb not null, status text not null default 'pending' check (status in ('pending','confirmed','preparing','dispatched','out_for_delivery','delivered','cancelled')),
  payment_status text not null default 'pending', total numeric(12,2) not null default 0 check (total >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.material_orders(id) on delete cascade,
  material_id uuid not null references public.materials(id), quantity integer not null check (quantity > 0), unit_price numeric(12,2) not null check (unit_price >= 0), created_at timestamptz not null default now()
);
create index if not exists material_orders_customer_idx on public.material_orders(customer_id, created_at desc);

create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(), name text not null, category text not null, experience_years integer, rating numeric(2,1), availability text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.contractor_members (
  id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractors(id) on delete cascade, name text not null, role text, experience_years integer, rating numeric(2,1), availability text
);
create table if not exists public.contractor_requests (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade, contractor_id uuid not null references public.contractors(id), project_id uuid references public.projects(id), message text, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade, title text not null, description text, status text not null default 'pending', priority text not null default 'medium', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade, project_id uuid references public.projects(id), type text not null, description text not null, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(), report_id uuid not null references public.reports(id) on delete cascade, storage_path text not null, content_type text not null, created_at timestamptz not null default now()
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text, content text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade, created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (conversation_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references public.profiles(id), content text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null, title text not null, body text, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, project_id uuid references public.projects(id), title text not null, notes text, event_date date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, label text, address_line text not null, city text, state text, pincode text, latitude double precision, longitude double precision, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, shop_id uuid references public.shops(id), contractor_id uuid references public.contractors(id), rating integer not null check (rating between 1 and 5), body text, created_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.material_orders(id) on delete cascade, provider text, provider_payment_id text unique, amount numeric(12,2) not null check (amount >= 0), status text not null default 'pending', created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.cart enable row level security;
alter table public.cart_items enable row level security;
alter table public.material_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contractor_requests enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;
alter table public.report_attachments enable row level security;
alter table public.notes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.calendar_events enable row level security;
alter table public.addresses enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_owner on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy projects_member on public.projects for all using (owner_id = auth.uid() or exists (select 1 from public.project_members pm where pm.project_id = id and pm.user_id = auth.uid())) with check (owner_id = auth.uid());
create policy project_members_owner on public.project_members for all using (user_id = auth.uid() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())) with check (user_id = auth.uid() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy cart_owner on public.cart for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_owner on public.cart_items for all using (exists (select 1 from public.cart c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.cart c where c.id = cart_id and c.user_id = auth.uid()));
create policy orders_owner on public.material_orders for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy order_items_owner on public.order_items for select using (exists (select 1 from public.material_orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy contractor_requests_owner on public.contractor_requests for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy tasks_owner on public.tasks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy reports_owner on public.reports for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy report_attachments_owner on public.report_attachments for all using (exists (select 1 from public.reports r where r.id = report_id and r.customer_id = auth.uid())) with check (exists (select 1 from public.reports r where r.id = report_id and r.customer_id = auth.uid()));
create policy notes_owner on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conversation_member on public.conversation_members for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy messages_member on public.messages for all using (exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid())) with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()));
create policy notifications_owner on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy events_owner on public.calendar_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_owner on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_owner on public.reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy payments_owner on public.payments for select using (exists (select 1 from public.material_orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy audit_owner on public.audit_logs for select using (actor_id = auth.uid());

create policy catalog_materials_read on public.materials for select to authenticated using (true);
create policy catalog_categories_read on public.material_categories for select to authenticated using (true);
create policy catalog_shops_read on public.shops for select to authenticated using (true);
create policy catalog_shop_materials_read on public.shop_materials for select to authenticated using (true);
