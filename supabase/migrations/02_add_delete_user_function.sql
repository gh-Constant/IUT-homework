-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.delete_user_data(UUID);

-- Function to delete user and their data with security definer
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = user_id
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Delete assignments (will cascade)
    DELETE FROM assignments WHERE created_by = user_id;
    
    -- Delete the user
    DELETE FROM users WHERE id = user_id;
    
    -- Verify deletion
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = user_id
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE EXCEPTION 'Failed to delete user';
    END IF;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO public; 