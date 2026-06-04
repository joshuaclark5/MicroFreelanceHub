-- Add lead tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS signup_landing_page TEXT,
ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_profiles_lead_source ON public.profiles(lead_source);
CREATE INDEX IF NOT EXISTS idx_profiles_landing_page ON public.profiles(signup_landing_page);
