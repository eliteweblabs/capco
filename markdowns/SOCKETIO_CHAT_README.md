# Socket.io Chat System

This is a completely separate Socket.io-based chat system that runs alongside your existing HTTP-based chat. It provides real-time WebSocket connections for instant messaging.

## 🚀 Quick Start

### 1. Start the Socket.io Server

```bash
# Option 1: Use the startup script (recommended)
./start-socketio-chat.sh

# Option 2: Manual start
node socketio-chat-server.js
```

The server will run on **port 3001** by default.

### 2. Test the Chat System

1. **Open the test page**: Navigate to `/socketio-chat-test` in your browser
2. **Open multiple tabs**: Open the same page in different browser tabs
3. **Look for the chat icon**: Bottom-right corner (different from HTTP chat)
4. **Start chatting**: Click the icon and start sending messages

## 📁 Files Created

| File                                           | Purpose                                |
| ---------------------------------------------- | -------------------------------------- |
| `socketio-chat-server.js`                      | Socket.io server (port 3001)           |
| `src/components/common/SocketChatWidget.astro` | Socket.io chat widget component        |
| `src/pages/socketio-chat-test.astro`           | Test page for Socket.io chat           |
| `start-socketio-chat.sh`                       | Startup script with environment checks |

## 🔧 Configuration

### Environment Variables Required

Make sure your `.env` file contains:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_service_role_key
```

### CORS Settings

The server is configured to allow connections from:

- `http://localhost:4321` (Astro dev server)
- `http://localhost:3000` (alternative port)
- `https://capcofire.com` (your production domain)

## ✨ Features

### Real-time Features

- ✅ **Instant message delivery** via WebSockets
- ✅ **Typing indicators** - see when others are typing
- ✅ **Online presence** - see who's currently active
- ✅ **User join/leave notifications** - know when people join/leave
- ✅ **Connection status** - see if you're connected to the server

### Database Integration

- ✅ **Message persistence** - messages saved to Supabase `chat_messages` table
- ✅ **Chat history** - new users get recent message history
- ✅ **Automatic cleanup** - old messages (30+ days) are automatically deleted

### User Experience

- ✅ **Admin/Staff only** - automatically hidden for clients
- ✅ **Unread count badges** - notification bubbles for new messages
- ✅ **Chat state persistence** - remembers if chat was open/closed
- ✅ **Responsive design** - works on desktop and mobile

## 🔄 Socket.io vs HTTP Chat

| Feature                   | Socket.io Chat        | HTTP Chat         |
| ------------------------- | --------------------- | ----------------- |
| **Real-time delivery**    | ✅ Instant            | ⏱️ 5-second delay |
| **Typing indicators**     | ✅ Real-time          | ❌ Not available  |
| **Connection status**     | ✅ Live status        | ⚠️ Polling-based  |
| **Server requirements**   | ⚠️ Separate server    | ✅ Integrated     |
| **Dependencies**          | ⚠️ Socket.io, Express | ✅ None           |
| **Deployment complexity** | ⚠️ More complex       | ✅ Simple         |

## 🛠️ Development

### Running Both Systems

You can run both chat systems simultaneously:

1. **HTTP Chat** (existing): Runs with your Astro app
2. **Socket.io Chat** (new): Runs on separate port 3001

### Testing

1. **Start both systems**:

   ```bash
   # Terminal 1: Start Astro app
   npm run dev

   # Terminal 2: Start Socket.io server
   ./start-socketio-chat.sh
   ```

2. **Test both chats**:
   - HTTP Chat: Bottom-left corner (existing)
   - Socket.io Chat: Bottom-right corner (new)

### Debugging

Check the browser console for Socket.io connection logs:

- `🔔 [SOCKETIO-CHAT]` - General chat events
- `✅ [SOCKETIO-CHAT]` - Success messages
- `❌ [SOCKETIO-CHAT]` - Error messages

## 🚀 Production Deployment

### Railway/Render Deployment

1. **Add Socket.io server to your deployment**:

   ```bash
   # Add to your package.json scripts
   "chat-server": "node socketio-chat-server.js"
   ```

2. **Update your deployment config** to run both:
   - Main Astro app
   - Socket.io chat server

3. **Update CORS settings** in `socketio-chat-server.js` with your production domain

### Environment Variables

Make sure your production environment has:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 🔒 Security

- **Row Level Security (RLS)** enabled on `chat_messages` table
- **Admin/Staff only** access enforced
- **Service Role Key** used for server operations (bypasses RLS)
- **CORS protection** with specific allowed origins

## 📊 Database Schema

Uses the existing `chat_messages` table:

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Next Steps

1. **Test the Socket.io chat** using the test page
2. **Compare performance** with HTTP chat
3. **Choose which system** to use in production
4. **Remove unused system** once you've decided

The Socket.io system provides better real-time experience but requires more infrastructure. The HTTP system is simpler but has polling delays.
