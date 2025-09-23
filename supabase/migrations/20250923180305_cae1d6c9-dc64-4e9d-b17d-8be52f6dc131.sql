-- Fix Security Definer View issue by removing the view entirely
-- and relying on RLS policies on the base table instead

DROP VIEW IF EXISTS public.google_integration_metadata;

-- The base table google_integrations already has proper RLS policies:
-- 1. "Users can view their own integrations" - allows users to see all their own data
-- 2. "Project admins can view integration metadata (non-sensitive)" - restricts admin access
-- 
-- This approach is more secure than using views with security definer properties
-- Frontend code should select only the needed columns to avoid sensitive data exposure