-- Tabelle für den Lernfortschritt der Vokabel-App (mehrsprachig: Spanisch/
-- Französisch/Italienisch, unterschieden über die Spalte "lang").
-- Im selben Supabase-Projekt anlegen, das auch die Habit-Tracker-App nutzt
-- (Auth/User-Verwaltung wird dadurch automatisch mitgenutzt).
--
-- WICHTIG, falls die Tabelle schon existiert (aus der Zeit vor Mehrsprachigkeit):
-- "create table if not exists" legt dann NICHTS neu an und die "lang"-Spalte
-- fehlt weiterhin. Stattdessen einmalig diese Migration ausführen:
--
--   alter table public.vocab_progress add column if not exists lang text not null default 'es';
--   alter table public.vocab_progress drop constraint vocab_progress_pkey;
--   alter table public.vocab_progress add primary key (user_id, lang, word_id, direction);
--
-- Bestehende Zeilen bekommen dabei automatisch lang='es', da sie ausschließlich
-- aus der Spanisch-Zeit stammen -- kein Fortschritt geht verloren.

create table if not exists public.vocab_progress (
    user_id     uuid references auth.users(id) on delete cascade not null,
    lang        text not null default 'es',
    word_id     integer not null,
    direction   text not null check (direction in ('es-de', 'de-es')),
    interval    integer not null default 0,
    ease        numeric not null default 2.5,
    due_date    bigint not null,
    repetitions integer not null default 0,
    state       text not null default 'new',
    updated_at  timestamptz not null default now(),
    primary key (user_id, lang, word_id, direction)
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
