-- Phase 1: Clean up all existing pending invitations
DELETE FROM public.project_invitations WHERE status = 'pending';

-- Phase 2: Enforce one-user-one-project at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_user_one_project 
ON public.project_members(user_id);

COMMENT ON INDEX idx_one_user_one_project IS 
'Ensures each user can only belong to one project for data isolation and security';

-- Phase 3: Add invitation cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete invitations that expired more than 30 days ago
  DELETE FROM project_invitations 
  WHERE status = 'pending' 
    AND expires_at < NOW() - INTERVAL '30 days';
  
  -- Update status for recently expired invitations
  UPDATE project_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_invitations IS 
'Cleans up expired project invitations - should be run periodically';