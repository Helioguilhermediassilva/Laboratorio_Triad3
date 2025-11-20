-- Add terms acceptance tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN terms_accepted_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when user accepted the terms of use';