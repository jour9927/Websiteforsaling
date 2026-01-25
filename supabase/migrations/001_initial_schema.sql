-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE event_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  status event_status DEFAULT 'draft' NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status registration_status DEFAULT 'pending' NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Draw results table
CREATE TABLE draw_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  drawn_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_announcements_published ON announcements(published_at);
CREATE INDEX idx_draw_results_event ON draw_results(event_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Registrations policies
CREATE POLICY "Users can view own registrations"
  ON registrations FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can register for events"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
  ON registrations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can cancel own registrations"
  ON registrations FOR DELETE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Announcements policies
CREATE POLICY "Published announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (
    published_at IS NOT NULL OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Draw results policies
CREATE POLICY "Users can view own draw results"
  ON draw_results FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can insert draw results"
  ON draw_results FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Useful functions

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get event registration count
CREATE OR REPLACE FUNCTION get_event_registration_count(event_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM registrations
    WHERE registrations.event_id = get_event_registration_count.event_id
      AND status = 'confirmed'
  );
END;
$$ LANGUAGE plpgsql;

-- Check if event is full
CREATE OR REPLACE FUNCTION is_event_full(event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_p INTEGER;
  current_count INTEGER;
BEGIN
  SELECT max_participants INTO max_p
  FROM events
  WHERE id = event_id;
  
  IF max_p IS NULL THEN
    RETURN FALSE;
  END IF;
  
  current_count := get_event_registration_count(event_id);
  
  RETURN current_count >= max_p;
END;
$$ LANGUAGE plpgsql;
