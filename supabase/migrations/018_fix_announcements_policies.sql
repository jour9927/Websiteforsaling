-- Fix announcements policies to include WITH CHECK clause
-- This ensures admins can insert and update announcements properly

DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
