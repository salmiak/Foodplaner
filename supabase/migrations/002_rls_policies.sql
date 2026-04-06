-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_recipes ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: check plan membership ───────────────────────────────────

CREATE OR REPLACE FUNCTION is_plan_member(p_plan_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_members
    WHERE plan_id = p_plan_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_plan_owner(p_plan_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_members
    WHERE plan_id = p_plan_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- ─── plans ────────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view their plans"
  ON plans FOR SELECT
  USING (is_plan_member(id));

CREATE POLICY "Owners can update their plans"
  ON plans FOR UPDATE
  USING (is_plan_owner(id));

CREATE POLICY "Authenticated users can create plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can delete their plans"
  ON plans FOR DELETE
  USING (is_plan_owner(id));

-- ─── plan_members ─────────────────────────────────────────────────────────────

CREATE POLICY "Members can view plan members"
  ON plan_members FOR SELECT
  USING (is_plan_member(plan_id));

CREATE POLICY "Owners can add members"
  ON plan_members FOR INSERT
  WITH CHECK (is_plan_owner(plan_id) OR user_id = auth.uid());

CREATE POLICY "Owners can remove members"
  ON plan_members FOR DELETE
  USING (is_plan_owner(plan_id) OR user_id = auth.uid());

-- ─── weeks ────────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view weeks"
  ON weeks FOR SELECT
  USING (is_plan_member(plan_id));

CREATE POLICY "Members can create weeks"
  ON weeks FOR INSERT
  WITH CHECK (is_plan_member(plan_id));

CREATE POLICY "Members can delete weeks"
  ON weeks FOR DELETE
  USING (is_plan_member(plan_id));

-- ─── meals ────────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view meals"
  ON meals FOR SELECT
  USING (is_plan_member(plan_id));

CREATE POLICY "Members can create meals"
  ON meals FOR INSERT
  WITH CHECK (is_plan_member(plan_id));

CREATE POLICY "Members can update meals"
  ON meals FOR UPDATE
  USING (is_plan_member(plan_id));

CREATE POLICY "Members can delete meals"
  ON meals FOR DELETE
  USING (is_plan_member(plan_id));

-- ─── recipes ──────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view recipes"
  ON recipes FOR SELECT
  USING (is_plan_member(plan_id));

CREATE POLICY "Members can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (is_plan_member(plan_id));

CREATE POLICY "Members can update recipes"
  ON recipes FOR UPDATE
  USING (is_plan_member(plan_id));

CREATE POLICY "Members can delete recipes"
  ON recipes FOR DELETE
  USING (is_plan_member(plan_id));

-- ─── meal_recipes ─────────────────────────────────────────────────────────────

-- meal_recipes doesn't have plan_id directly, so we join through meals
CREATE POLICY "Members can view meal_recipes"
  ON meal_recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meals m
      WHERE m.id = meal_id AND is_plan_member(m.plan_id)
    )
  );

CREATE POLICY "Members can add meal_recipes"
  ON meal_recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals m
      WHERE m.id = meal_id AND is_plan_member(m.plan_id)
    )
  );

CREATE POLICY "Members can delete meal_recipes"
  ON meal_recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meals m
      WHERE m.id = meal_id AND is_plan_member(m.plan_id)
    )
  );
