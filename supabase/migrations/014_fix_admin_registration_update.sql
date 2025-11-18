-- Fix registrations UPDATE policy for admin
-- This ensures admins can update any registration status

-- Drop and recreate the UPDATE policy with proper admin check
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
DROP POLICY IF EXISTS "Admin can update registrations" ON registrations;

-- Policy for users to update their own registrations
CREATE POLICY "Users can update own registrations"
ON registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Separate policy for admins to update any registration
CREATE POLICY "Admin can update any registration"
ON registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
