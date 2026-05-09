-- ============================================
-- MELOFY - Schéma base de données Supabase
-- À exécuter dans Supabase > SQL Editor
-- ============================================

-- Table des chansons
create table if not exists songs (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete set null,
  title        text not null,
  style        text not null,
  lyrics       text,
  audio_url    text,
  image_url    text,
  status       text default 'pending', -- pending | generating | ready | error
  suno_job_id  text,
  is_favorite  boolean default false,
  created_at   timestamptz default now()
);

-- Table des commandes/paiements
create table if not exists orders (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete set null,
  song_id      uuid references songs(id) on delete set null,
  amount       integer not null, -- en centimes
  currency     text default 'XOF',
  status       text default 'pending', -- pending | paid | failed
  payment_ref  text unique,
  created_at   timestamptz default now()
);

-- Table des profils utilisateurs
create table if not exists profiles (
  id           uuid references auth.users(id) primary key,
  display_name text,
  avatar_url   text,
  plan         text default 'free', -- free | premium
  credits      integer default 1,
  has_invited  boolean default false,
  created_at   timestamptz default now()
);

-- Créer automatiquement un profil à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Activer Row Level Security
alter table songs    enable row level security;
alter table orders   enable row level security;
alter table profiles enable row level security;

-- Politiques RLS (chaque user voit seulement ses données, et tout le monde voit les chansons prêtes)
create policy "songs: voir les siennes ou prêtes" on songs for select using (auth.uid() = user_id or status = 'ready');
create policy "songs: créer"           on songs for insert with check (auth.uid() = user_id);
create policy "songs: modifier"        on songs for update using (auth.uid() = user_id);

create policy "orders: voir les siennes" on orders for select using (auth.uid() = user_id);
create policy "orders: créer"            on orders for insert with check (auth.uid() = user_id);

-- Politiques RLS
create policy "profiles: voir le sien"   on profiles for select using (auth.uid() = id);

-- Empêcher l'utilisateur de modifier ses crédits ou son plan
create policy "profiles: modifier son propre profil" on profiles 
for update using (auth.uid() = id)
with check (
  (old.credits = new.credits) AND 
  (old.plan = new.plan)
);

-- Créer le bucket de stockage audio
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
on conflict do nothing;

create policy "audio: upload"  on storage.objects for insert with check (bucket_id = 'audio');
create policy "audio: lecture" on storage.objects for select using (bucket_id = 'audio');
alter table orders add constraint orders_payment_ref_key unique (payment_ref);
