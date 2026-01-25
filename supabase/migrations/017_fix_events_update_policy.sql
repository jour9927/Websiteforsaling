-- Fix events UPDATE policy to include WITH CHECK clause
-- This ensures admins can update events properly

DROP POLICY IF EXISTS "Admins can update events" ON events;

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
