-- Add language preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Create medical reports table
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  extracted_data jsonb NOT NULL,
  recommendations text,
  image_url text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medical reports"
ON public.medical_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical reports"
ON public.medical_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical reports"
ON public.medical_reports FOR DELETE
USING (auth.uid() = user_id);

-- Create weight tracking table
CREATE TABLE IF NOT EXISTS public.weight_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric NOT NULL,
  height numeric,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weight entries"
ON public.weight_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries"
ON public.weight_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries"
ON public.weight_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create meal schedules table
CREATE TABLE IF NOT EXISTS public.meal_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name text NOT NULL,
  meal_time time NOT NULL,
  meal_instructions text,
  reminder_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal schedules"
ON public.meal_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal schedules"
ON public.meal_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal schedules"
ON public.meal_schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal schedules"
ON public.meal_schedules FOR DELETE
USING (auth.uid() = user_id);

-- Create chat history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat history"
ON public.chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Add fiber column to scan_history if not exists
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS fiber numeric DEFAULT 0;

-- Add items column for multi-item scans
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS items jsonb;

-- Add category icon to scan_history
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS category_icon text;

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for medical-reports bucket
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medical reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);