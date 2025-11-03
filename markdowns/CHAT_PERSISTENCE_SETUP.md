# Chat Persistence Setup

The chat system now supports persistent message storage using Supabase, so chat messages will survive page refreshes and server restarts.

## Setup Steps

### 1. Create the Chat Messages Table

You need to create the `chat_messages` table in your Supabase database. You have two options:

#### Option A: Manual Setup (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-chat-messages-table.sql`
4. Click **Run** to execute the SQL

#### Option B: Automated Setup

1. Set your environment variables:
   ```bash
   export PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-service-role-key"
   ```
2. Run the setup script:
   ```bash
   node setup-chat-database.js
   ```

### 2. Environment Variables

Make sure your chat server has access to these environment variables:

```bash
export PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-service-role-key"
```

**Important**: Use the **Service Role Key** (not the anon key) for the chat server, as it needs to bypass RLS policies for system operations.

### 3. Restart the Chat Server

After setting up the database table, restart the chat server:

```bash
pkill -f "chat-server.mjs"
node chat-server.mjs
```

## Features

### ✅ Persistent Storage

- All chat messages are stored in Supabase
- Messages survive page refreshes and server restarts
- Automatic cleanup of old messages (older than 30 days)

### ✅ Real-time Updates

- Messages are broadcast in real-time to all connected users
- New users receive chat history when they join
- Typing indicators and user presence

### ✅ Security

- Row Level Security (RLS) enabled
- Users can only see messages (for chat history)
- Users can only insert their own messages
- Admins have full access (view/delete any message)

### ✅ Performance

- Indexed queries for fast message retrieval
- Limited to last 50 messages for new users
- Automatic cleanup prevents database bloat

## Database Schema

```sql
chat_messages:
- id: SERIAL PRIMARY KEY
- user_id: UUID (references auth.users)
- user_name: TEXT
- user_role: TEXT
- message: TEXT
- timestamp: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

## Troubleshooting

### Chat Server Won't Start

- Check environment variables are set correctly
- Ensure Supabase service role key has proper permissions
- Verify the `chat_messages` table exists

### Messages Not Saving

- Check Supabase logs for RLS policy violations
- Verify user authentication is working
- Check network connectivity to Supabase

### No Chat History

- Ensure the table was created successfully
- Check RLS policies allow reading messages
- Verify the chat server can connect to Supabase

## Testing

1. Start the chat server: `node chat-server.mjs`
2. Open the chat widget in your browser
3. Send a few messages
4. Refresh the page
5. Messages should still be visible in the chat history

The chat system now provides a persistent, real-time communication experience that maintains conversation history across sessions! 🚀
