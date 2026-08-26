-- Tabelle für den Lernfortschritt der Vokabel-App.
-- Im selben Supabase-Projekt anlegen, das auch die Habit-Tracker-App nutzt
-- (Auth/User-Verwaltung wird dadurch automatisch mitgenutzt).

create table if not exists public.vocab_progress (
    user_id     uuid references auth.users(id) on delete cascade not null,
    word_id     integer not null,
    direction   text not null check (direction in ('es-de', 'de-es')),
    interval    integer not null default 0,
    ease        numeric not null default 2.5,
    due_date    bigint not null,
    repetitions integer not null default 0,
    state       text not null default 'new',
    updated_at  timestamptz not null default now(),
    primary key (user_id, word_id, direction)
);

-- Row Level Security: jeder Nutzer sieht/ändert ausschließlich seinen eigenen Fortschritt
alter table public.vocab_progress enable row level security;

create policy "vocab_progress_select_own"
    on public.vocab_progress for select
    using (auth.uid() = user_id);

create policy "vocab_progress_upsert_own"
    on public.vocab_progress for insert
    with check (auth.uid() = user_id);

create policy "vocab_progress_update_own"
    on public.vocab_progress for update
    using (auth.uid() = user_id);

create policy "vocab_progress_delete_own"
    on public.vocab_progress for delete
    using (auth.uid() = user_id);
