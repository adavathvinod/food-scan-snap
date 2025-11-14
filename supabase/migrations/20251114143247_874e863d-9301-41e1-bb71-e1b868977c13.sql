-- Create enum for subscription plans
CREATE TYPE public.subscription_plan_type AS ENUM ('free', 'monthly', 'annual', 'enterprise');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial');

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type subscription_plan_type NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create enterprise_inquiries table for contact form
CREATE TABLE public.enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for enterprise_inquiries
CREATE POLICY "Users can insert their own inquiry"
ON public.enterprise_inquiries
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own inquiries"
ON public.enterprise_inquiries
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_type, name, price, duration_days, features) VALUES
('free', 'Free Trial', 0, 30, '["Access to all core scanning features", "Limited scans per day", "Shows remaining trial days", "Auto-expire after 30 days", "Option to upgrade anytime"]'),
('monthly', 'Monthly Plan', 50, 30, '["Unlimited scans for 30 days", "AI insights, analytics, and reports", "Manual or auto renewal every month", "Priority email support"]'),
('annual', 'Annual Plan', 2000, 365, '["Unlimited scans for 12 months", "Access to all updates", "Priority support", "Renewal reminder before expiry", "Advanced analytics"]'),
('enterprise', 'Enterprise Plan', 5000, 365, '["Unlimited scans for staff or members", "AI medical insights and reports", "Custom branding (logo, name, etc.)", "Dedicated support", "Yearly contract renewal", "Advanced dashboards"]');

-- Function to automatically create free trial for new users
CREATE OR REPLACE FUNCTION public.create_free_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status, amount, expiry_date)
  VALUES (
    NEW.id,
    'free',
    'trial',
    0,
    NOW() + INTERVAL '30 days'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create free trial on user signup
CREATE TRIGGER on_user_created_create_trial
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_free_trial_subscription();