-- Create table for storing user health conditions
CREATE TABLE IF NOT EXISTS public.user_health_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  condition_name TEXT NOT NULL,
  severity TEXT, -- mild, moderate, severe
  detected_from TEXT, -- 'medical_report', 'user_selected', 'ai_analysis'
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_health_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own health conditions"
ON public.user_health_conditions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health conditions"
ON public.user_health_conditions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health conditions"
ON public.user_health_conditions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health conditions"
ON public.user_health_conditions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_health_conditions_user_id ON public.user_health_conditions(user_id);
CREATE INDEX idx_user_health_conditions_active ON public.user_health_conditions(user_id, is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_user_health_conditions_updated_at
BEFORE UPDATE ON public.user_health_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();