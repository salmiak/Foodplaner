-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE meals;
ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE weeks;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_members;
