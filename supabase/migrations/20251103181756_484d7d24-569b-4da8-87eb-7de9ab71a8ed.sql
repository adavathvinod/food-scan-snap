-- Create Indian food nutrition database
CREATE TABLE IF NOT EXISTS public.indian_food_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name TEXT NOT NULL,
  alternative_names TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g NUMERIC(5,1) NOT NULL,
  fat_g NUMERIC(5,1) NOT NULL,
  carbs_g NUMERIC(5,1) NOT NULL,
  fiber_g NUMERIC(5,1) NOT NULL,
  serving_size TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster searches
CREATE INDEX idx_indian_food_name ON public.indian_food_nutrition(LOWER(food_name));
CREATE INDEX idx_indian_food_alternatives ON public.indian_food_nutrition USING GIN(alternative_names);

-- Enable RLS
ALTER TABLE public.indian_food_nutrition ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read (it's reference data)
CREATE POLICY "Anyone can view Indian food nutrition data"
  ON public.indian_food_nutrition
  FOR SELECT
  USING (true);

-- Allow authenticated users to suggest new entries
CREATE POLICY "Authenticated users can suggest new foods"
  ON public.indian_food_nutrition
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert common Indian foods with accurate nutrition data
-- Breads/Rotis (per piece)
INSERT INTO public.indian_food_nutrition (food_name, alternative_names, category, calories, protein_g, fat_g, carbs_g, fiber_g, serving_size, notes) VALUES
('Roti', ARRAY['chapati', 'phulka', 'indian bread'], 'bread', 71, 3.0, 0.4, 15.0, 2.1, '1 medium roti (35g)', 'Made with whole wheat flour'),
('Paratha', ARRAY['plain paratha', 'lachha paratha'], 'bread', 126, 3.0, 5.2, 18.0, 2.0, '1 medium paratha (50g)', 'Pan-fried flatbread'),
('Naan', ARRAY['plain naan', 'butter naan'], 'bread', 262, 7.0, 5.0, 48.0, 2.0, '1 medium naan (90g)', 'Tandoor-baked leavened bread'),
('Puri', ARRAY['poori', 'deep fried bread'], 'bread', 164, 4.0, 9.5, 17.0, 1.5, '1 medium puri (40g)', 'Deep-fried puffed bread'),

-- Rice Dishes (per cup/serving)
('Plain Rice', ARRAY['steamed rice', 'white rice', 'boiled rice'], 'rice', 205, 4.3, 0.4, 45.0, 0.6, '1 cup cooked (158g)', 'Plain white rice'),
('Biryani', ARRAY['chicken biryani', 'veg biryani', 'mutton biryani'], 'rice', 290, 12.0, 8.0, 42.0, 2.5, '1 cup (200g)', 'Spiced rice with meat/vegetables'),
('Pulao', ARRAY['veg pulao', 'vegetable pulao', 'pilaf'], 'rice', 195, 4.0, 4.5, 35.0, 2.0, '1 cup (180g)', 'Mildly spiced rice'),
('Curd Rice', ARRAY['yogurt rice', 'thayir sadam'], 'rice', 160, 5.0, 3.5, 28.0, 1.0, '1 cup (180g)', 'Rice mixed with yogurt'),

-- Dal/Lentils (per cup)
('Dal', ARRAY['dal tadka', 'yellow dal', 'toor dal', 'lentil curry'], 'curry', 200, 12.0, 5.0, 30.0, 8.0, '1 cup (240ml)', 'Cooked lentils with spices'),
('Sambar', ARRAY['sambhar', 'south indian dal'], 'curry', 120, 6.0, 2.5, 20.0, 5.0, '1 cup (240ml)', 'Lentil and vegetable stew'),
('Rajma', ARRAY['kidney beans curry', 'red kidney beans'], 'curry', 240, 15.0, 1.0, 42.0, 11.0, '1 cup (240ml)', 'Kidney beans curry'),
('Chana Masala', ARRAY['chole', 'chickpea curry'], 'curry', 210, 11.0, 4.0, 36.0, 10.0, '1 cup (240ml)', 'Spiced chickpea curry'),

-- Vegetable Curries (per cup)
('Aloo Gobi', ARRAY['potato cauliflower', 'aloo gobhi'], 'curry', 150, 4.0, 7.0, 20.0, 4.0, '1 cup (200g)', 'Potato and cauliflower curry'),
('Palak Paneer', ARRAY['spinach paneer', 'saag paneer'], 'curry', 270, 14.0, 18.0, 12.0, 4.0, '1 cup (240g)', 'Spinach and cottage cheese'),
('Bhindi Masala', ARRAY['okra curry', 'lady finger curry'], 'curry', 90, 2.5, 4.0, 12.0, 3.0, '1 cup (160g)', 'Spiced okra'),
('Baingan Bharta', ARRAY['eggplant curry', 'brinjal bharta'], 'curry', 110, 2.5, 7.0, 10.0, 5.0, '1 cup (200g)', 'Mashed roasted eggplant'),

-- Paneer Dishes
('Paneer Tikka', ARRAY['grilled paneer', 'paneer kabab'], 'paneer', 265, 14.0, 19.0, 9.0, 1.0, '6 pieces (150g)', 'Grilled cottage cheese'),
('Paneer Butter Masala', ARRAY['paneer makhani'], 'curry', 325, 12.0, 25.0, 14.0, 2.0, '1 cup (240g)', 'Paneer in creamy tomato sauce'),
('Shahi Paneer', ARRAY['paneer korma'], 'curry', 310, 11.0, 24.0, 13.0, 2.0, '1 cup (240g)', 'Paneer in rich cream sauce'),

-- Non-Veg Curries
('Chicken Curry', ARRAY['chicken masala', 'murgh curry'], 'curry', 245, 28.0, 12.0, 8.0, 2.0, '1 cup with 2 pieces (240g)', 'Chicken in spiced gravy'),
('Butter Chicken', ARRAY['murgh makhani', 'chicken makhani'], 'curry', 290, 24.0, 18.0, 10.0, 1.5, '1 cup (240g)', 'Chicken in creamy tomato sauce'),
('Tandoori Chicken', ARRAY['tandoori murgh'], 'grilled', 200, 30.0, 8.0, 4.0, 0.5, '2 pieces (150g)', 'Yogurt-marinated grilled chicken'),

-- Snacks
('Samosa', ARRAY['potato samosa', 'veg samosa'], 'snack', 262, 5.0, 13.0, 32.0, 3.0, '1 large samosa (100g)', 'Deep-fried pastry with filling'),
('Pakora', ARRAY['pakore', 'bhaji', 'vegetable fritter', 'pakoda'], 'snack', 165, 4.0, 10.0, 15.0, 2.0, '5 pieces (80g)', 'Deep-fried battered vegetables'),
('Vada Pav', ARRAY['wada pav', 'vada pao'], 'snack', 286, 6.0, 14.0, 35.0, 3.0, '1 piece (120g)', 'Potato fritter in bread bun'),
('Dosa', ARRAY['plain dosa', 'sada dosa'], 'snack', 133, 4.0, 2.5, 25.0, 2.0, '1 medium dosa (120g)', 'Fermented rice and lentil crepe'),
('Idli', ARRAY['steamed rice cake'], 'snack', 39, 1.5, 0.2, 8.0, 0.8, '1 piece (40g)', 'Steamed fermented rice cake'),
('Medu Vada', ARRAY['urad dal vada', 'vadai'], 'snack', 192, 7.0, 10.0, 18.0, 3.0, '1 piece (60g)', 'Fried lentil donut'),

-- Drinks
('Chai', ARRAY['indian tea', 'masala chai', 'tea'], 'drink', 50, 1.5, 2.0, 6.0, 0.0, '1 cup (240ml)', 'Spiced milk tea with sugar'),
('Lassi', ARRAY['sweet lassi', 'yogurt drink'], 'drink', 180, 8.0, 4.0, 28.0, 0.0, '1 glass (240ml)', 'Yogurt-based drink'),
('Buttermilk', ARRAY['chaas', 'chaach', 'moru'], 'drink', 40, 2.5, 0.5, 6.0, 0.0, '1 glass (240ml)', 'Spiced diluted yogurt drink'),

-- Desserts
('Gulab Jamun', ARRAY['gulab jamoon'], 'dessert', 175, 3.0, 7.0, 25.0, 0.5, '1 piece (40g)', 'Fried milk-solid balls in syrup'),
('Rasgulla', ARRAY['rasagulla', 'rosogolla'], 'dessert', 186, 4.0, 1.0, 40.0, 0.0, '2 pieces (100g)', 'Cottage cheese balls in syrup'),
('Kheer', ARRAY['rice pudding', 'payasam'], 'dessert', 194, 5.0, 5.5, 32.0, 0.5, '1 cup (150g)', 'Rice pudding with milk'),
('Jalebi', ARRAY['jilebi'], 'dessert', 150, 1.0, 5.0, 26.0, 0.0, '2 pieces (50g)', 'Fried sweet pretzel in syrup');

-- Add trigger for updated_at
CREATE TRIGGER update_indian_food_nutrition_updated_at
  BEFORE UPDATE ON public.indian_food_nutrition
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();