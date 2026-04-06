-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Plans ───────────────────────────────────────────────────────────────────

CREATE TABLE plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Plan Members ─────────────────────────────────────────────────────────────

CREATE TABLE plan_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id   uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, user_id)
);

CREATE INDEX plan_members_plan_id_idx ON plan_members(plan_id);
CREATE INDEX plan_members_user_id_idx ON plan_members(user_id);

-- ─── Weeks ────────────────────────────────────────────────────────────────────

CREATE TABLE weeks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  year        integer NOT NULL,
  week_number integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, year, week_number)
);

CREATE INDEX weeks_plan_id_idx ON weeks(plan_id);

-- ─── Meals ────────────────────────────────────────────────────────────────────

CREATE TABLE meals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id     uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Mon … 7=Sun, NULL=unassigned
  title       text NOT NULL,
  comment     jsonb,           -- Tiptap JSON document
  is_done     boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meals_week_id_idx ON meals(week_id);
CREATE INDEX meals_plan_id_idx ON meals(plan_id);
CREATE INDEX meals_day_of_week_idx ON meals(day_of_week);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Recipes ──────────────────────────────────────────────────────────────────

CREATE TABLE recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title       text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('url', 'image', 'text')),
  url         text,            -- when kind = 'url'
  image_path  text,            -- storage path when kind = 'image'
  content     jsonb,           -- Tiptap JSON when kind = 'text'
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recipes_plan_id_idx ON recipes(plan_id);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Meal Recipes (join table) ────────────────────────────────────────────────

CREATE TABLE meal_recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (meal_id, recipe_id)
);

CREATE INDEX meal_recipes_meal_id_idx ON meal_recipes(meal_id);
CREATE INDEX meal_recipes_recipe_id_idx ON meal_recipes(recipe_id);
