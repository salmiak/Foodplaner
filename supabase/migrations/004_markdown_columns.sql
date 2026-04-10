-- Migrate meals.comment and recipes.content from jsonb (Tiptap JSON)
-- to plain text (Markdown). Existing Tiptap JSON cannot be auto-converted
-- to Markdown, so existing values are cleared.

ALTER TABLE meals
  ALTER COLUMN comment TYPE text USING NULL::text;

ALTER TABLE recipes
  ALTER COLUMN content TYPE text USING NULL::text;

COMMENT ON COLUMN meals.comment   IS 'Markdown-formatted notes';
COMMENT ON COLUMN recipes.content IS 'Markdown-formatted recipe text (when kind = ''text'')';
