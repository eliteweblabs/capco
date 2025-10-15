  -- Cal.com Database Schema for Supabase
  -- This creates the necessary tables for Cal.com in your existing Supabase database

  -- Users table (extends auth.users)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMP,
    bio TEXT,
    avatar VARCHAR(500),
    time_zone VARCHAR(50) DEFAULT 'America/New_York',
    week_start VARCHAR(10) DEFAULT 'Sunday',
    start_time INTEGER DEFAULT 0,
    end_time INTEGER DEFAULT 1440,
    buffer_time INTEGER DEFAULT 0,
    hide_branding BOOLEAN DEFAULT FALSE,
    theme VARCHAR(50) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    identity_provider VARCHAR(50) DEFAULT 'CAL',
    brand_color VARCHAR(7) DEFAULT '#292929',
    dark_brand_color VARCHAR(7) DEFAULT '#fafafa',
    metadata JSONB DEFAULT '{}',
    locale VARCHAR(10) DEFAULT 'en',
    role VARCHAR(20) DEFAULT 'USER'
  );

  -- Event types
  CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    length INTEGER NOT NULL,
    locations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    recurring_event JSONB,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    disable_guests BOOLEAN DEFAULT FALSE,
    hide_attendees BOOLEAN DEFAULT FALSE,
    price INTEGER DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'usd',
    booking_fields JSONB DEFAULT '[]',
    success_redirect_url VARCHAR(500),
    team_id INTEGER,
    parent_id INTEGER,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    before_event_buffer INTEGER DEFAULT 0,
    after_event_buffer INTEGER DEFAULT 0,
    seats_per_time_slot INTEGER,
    seats_show_availability_count BOOLEAN DEFAULT FALSE,
    schedule_id INTEGER,
    minimum_booking_notice INTEGER DEFAULT 120,
    before_event_buffer_unit VARCHAR(10) DEFAULT 'minute',
    after_event_buffer_unit VARCHAR(10) DEFAULT 'minute',
    minimum_booking_notice_unit VARCHAR(10) DEFAULT 'minute',
    booking_limits JSONB,
    only_show_first_available_slot BOOLEAN DEFAULT FALSE,
    hidden BOOLEAN DEFAULT FALSE,
    assign_all_team_members BOOLEAN DEFAULT FALSE,
    use_event_type_destination_calendar_settings BOOLEAN DEFAULT FALSE,
    destination_calendar_id INTEGER,
    time_slot_increment INTEGER DEFAULT 15,
    requires_booker_email_verification BOOLEAN DEFAULT FALSE
  );

  -- Bookings
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    attendees JSONB DEFAULT '[]',
    responses JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'ACCEPTED',
    paid BOOLEAN DEFAULT FALSE,
    payment_id VARCHAR(255),
    event_type_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    dynamic_event_slug_ref VARCHAR(255),
    dynamic_group_slug_ref VARCHAR(255),
    rescheduled BOOLEAN DEFAULT FALSE,
    from_reschedule VARCHAR(255),
    recurring_event_id INTEGER,
    sms_reminder_number VARCHAR(255),
    location VARCHAR(500),
    cancellation_reason TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    booking_references JSONB DEFAULT '[]',
    is_recorded BOOLEAN DEFAULT FALSE,
    seats_references JSONB DEFAULT '[]',
    booking_fields JSONB DEFAULT '[]',
    price INTEGER DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'usd',
    paid_at TIMESTAMP,
    refund_id VARCHAR(255),
    rescheduled_at TIMESTAMP,
    no_show BOOLEAN DEFAULT FALSE,
    workflow_reminders JSONB DEFAULT '[]',
    scheduled_at TIMESTAMP,
    scheduled_for TIMESTAMP,
    time_zone VARCHAR(50) DEFAULT 'America/New_York',
    language VARCHAR(10) DEFAULT 'en',
    apps_status JSONB DEFAULT '{}',
    custom_inputs JSONB DEFAULT '[]'
  );

  -- Availability
  CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255),
    user_id INTEGER NOT NULL,
    event_type_id INTEGER,
    days INTEGER[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    date_overrides JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Schedules
  CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    time_zone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Teams
  CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo VARCHAR(500),
    bio TEXT,
    hide_branding BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Team members
  CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER',
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Webhooks
  CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscriber_url VARCHAR(500) NOT NULL,
    event_triggers TEXT[] NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON bookings(event_type_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_availability_user_id ON availability(user_id);
  CREATE INDEX IF NOT EXISTS idx_availability_event_type_id ON availability(event_type_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
  CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
  CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

  -- Enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies (using UUID-based auth system)
  CREATE POLICY "Users can view their own data" ON users FOR ALL USING (id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own event types" ON event_types FOR ALL USING (owner_id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own bookings" ON bookings FOR ALL USING (user_id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own availability" ON availability FOR ALL USING (user_id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own schedules" ON schedules FOR ALL USING (user_id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own teams" ON teams FOR ALL USING (id IN (SELECT team_id FROM team_members WHERE user_id::text = auth.uid()::text));
  CREATE POLICY "Users can view their own team memberships" ON team_members FOR ALL USING (user_id::text = auth.uid()::text);
  CREATE POLICY "Users can view their own webhooks" ON webhooks FOR ALL USING (user_id::text = auth.uid()::text);

  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON event_types TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON availability TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON schedules TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
