#!/bin/bash

# Cal.com Local Setup Script
# This script sets up Cal.com locally in your workspace

set -e

echo "📅 Setting up Cal.com locally..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create environment file for Cal.com
echo "📝 Creating Cal.com environment file..."

cat > .env.calcom << EOF
# Cal.com Environment Variables
# Copy your Supabase database URL here
DATABASE_URL=${SUPABASE_URL}

# Generate a random secret for NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CONTACTS_CLIENT_ID=${GOOGLE_CONTACTS_CLIENT_ID}
GOOGLE_CONTACTS_CLIENT_SECRET=${GOOGLE_CONTACTS_CLIENT_SECRET}

# Email configuration (optional)
EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST}
EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT}
EMAIL_SERVER_USER=${EMAIL_SERVER_USER}
EMAIL_SERVER_PASSWORD=${EMAIL_SERVER_PASSWORD}
EMAIL_FROM=${EMAIL_FROM}

# Webhook secret for your integration
CAL_WEBHOOK_SECRET=$(openssl rand -base64 32)

# PostgreSQL for Cal.com (if using separate DB)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
EOF

echo "✅ Environment file created: .env.calcom"

# Create Cal.com database schema
echo "🗄️ Setting up Cal.com database schema..."

# Check if we should use Supabase or separate PostgreSQL
read -p "Do you want to use your existing Supabase database for Cal.com? (y/n): " use_supabase

if [[ $use_supabase == "y" || $use_supabase == "Y" ]]; then
    echo "📊 Using Supabase database for Cal.com..."
    
    # Create Cal.com tables in Supabase
    cat > sql-queriers/calcom-schema.sql << 'EOF'
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
  requires_booker_email_verification BOOLEAN DEFAULT FALSE,
  disable_guests BOOLEAN DEFAULT FALSE,
  minimum_booking_notice INTEGER DEFAULT 120,
  before_event_buffer INTEGER DEFAULT 0,
  after_event_buffer INTEGER DEFAULT 0,
  seats_per_time_slot INTEGER,
  seats_show_availability_count BOOLEAN DEFAULT FALSE,
  schedule_id INTEGER,
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
  references JSONB DEFAULT '[]',
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
  custom_inputs JSONB DEFAULT '[]',
  rejection_reason TEXT,
  cancellation_reason TEXT,
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

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (id = auth.uid()::integer);
CREATE POLICY "Users can view their own event types" ON event_types FOR ALL USING (owner_id = auth.uid()::integer);
CREATE POLICY "Users can view their own bookings" ON bookings FOR ALL USING (user_id = auth.uid()::integer);
CREATE POLICY "Users can view their own availability" ON availability FOR ALL USING (user_id = auth.uid()::integer);
CREATE POLICY "Users can view their own schedules" ON schedules FOR ALL USING (user_id = auth.uid()::integer);
CREATE POLICY "Users can view their own teams" ON teams FOR ALL USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()::integer));
CREATE POLICY "Users can view their own team memberships" ON team_members FOR ALL USING (user_id = auth.uid()::integer);
CREATE POLICY "Users can view their own webhooks" ON webhooks FOR ALL USING (user_id = auth.uid()::integer);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
EOF

    echo "📊 Cal.com schema created for Supabase"
    echo "⚠️  Please run this SQL in your Supabase SQL Editor:"
    echo "   sql-queriers/calcom-schema.sql"
    
else
    echo "🐘 Using separate PostgreSQL database for Cal.com..."
    echo "📝 Update docker-compose.cal.yml with your PostgreSQL credentials"
fi

# Start Cal.com
echo "🚀 Starting Cal.com..."

# Copy environment file
cp .env.calcom .env

# Start with Docker Compose
docker-compose -f docker-compose.cal.yml up -d

echo "⏳ Waiting for Cal.com to start..."
sleep 30

# Check if Cal.com is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Cal.com is running at http://localhost:3000"
else
    echo "❌ Cal.com failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.cal.yml logs"
fi

echo ""
echo "🎉 Cal.com setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Access Cal.com at http://localhost:3000"
echo "2. Complete the initial setup wizard"
echo "3. Create your first event type"
echo "4. Update your Vapi.ai integration to use local Cal.com:"
echo "   - Change CAL_API_URL to http://localhost:3000/api"
echo "   - Update webhook URLs to point to your local instance"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.cal.yml logs"
echo "   - Stop: docker-compose -f docker-compose.cal.yml down"
echo "   - Restart: docker-compose -f docker-compose.cal.yml restart"
echo ""
echo "📚 Documentation: https://cal.com/docs"
