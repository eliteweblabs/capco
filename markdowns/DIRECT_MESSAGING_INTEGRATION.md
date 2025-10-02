# Direct Messaging Integration Guide

## Overview

This system adds 1-on-1 direct messaging capabilities to your existing Socket.io chat system. Users can send private messages to each other while maintaining the existing group chat functionality.

## Setup Steps

### 1. Run the SQL Migration

```bash
# Execute the SQL file to create the direct messages table
psql -h your-supabase-host -U postgres -d postgres -f sql-queriers/add-direct-messages-table.sql
```

### 2. Add Direct Messaging Component to Your Pages

#### For Pages with Chat (Admin/Staff only):

```astro
---
// In your layout or page files
import DirectMessaging from "@/components/common/DirectMessaging.astro";
---

<!-- Add after your existing SocketChatWidget -->
<DirectMessaging currentUser={currentUser} />
```

### 3. Restart Socket.io Server

```bash
# Restart your Socket.io server to load the new direct messaging handlers
npm run socketio-chat
# or
node socketio-chat-server.js
```

## How It Works

### **Two Chat Systems**

1. **Group Chat** (existing): Project-based discussions, team chat
2. **Direct Messages** (new): 1-on-1 private conversations

### **User Experience**

- **Toggle Button**: Separate buttons for group chat and direct messages
- **User List**: Shows online Admin/Staff users for direct messaging
- **Conversation View**: Clean interface for 1-on-1 conversations
- **Message History**: Persistent conversation history
- **Online Status**: Shows who's online for direct messaging

### **Features**

- ✅ **Private Conversations**: 1-on-1 messaging
- ✅ **Online Status**: See who's available
- ✅ **Message History**: Persistent conversation storage
- ✅ **Typing Indicators**: Real-time typing feedback
- ✅ **Unread Counts**: Notification badges for unread messages
- ✅ **Role-Based Access**: Only Admin/Staff can use direct messaging

## API Endpoints

### **Socket.io Events**

#### **Client to Server:**

```javascript
// Join direct messaging
socket.emit("join_dm", {
  userId: "user-id",
  userName: "User Name",
  userRole: "Admin",
});

// Send direct message
socket.emit("dm_message", {
  to: "recipient-user-id",
  message: "Hello!",
});

// Get conversation history
socket.emit("get_dm_history", {
  userId: "other-user-id",
});

// Typing indicator
socket.emit("dm_typing", {
  to: "recipient-user-id",
  isTyping: true,
});
```

#### **Server to Client:**

```javascript
// Online users list
socket.on("dm_user_list", (users) => {
  // Update user list
});

// New direct message
socket.on("dm_message", (message) => {
  // Display message
});

// Conversation history
socket.on("dm_conversation_history", (data) => {
  // Load conversation
});

// Typing indicator
socket.on("dm_user_typing", (data) => {
  // Show typing indicator
});
```

## Database Schema

### **direct_messages Table**

```sql
CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id),
  from_name TEXT NOT NULL,
  to_user UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### **Helper Functions**

- `get_conversation(user1_id, user2_id, limit)` - Get conversation between two users
- `mark_messages_as_read(conversation_user_id, current_user_id)` - Mark messages as read
- `get_unread_message_count(user_id)` - Get unread count for user
- `get_recent_conversations(user_id, limit)` - Get recent conversations

## Security

### **Row Level Security (RLS)**

- Users can only see messages they sent or received
- Users can only send messages as themselves
- Users can only update/delete their own messages

### **Access Control**

- Only Admin/Staff users can access direct messaging
- Clients see no direct messaging interface
- Messages are private between participants

## Usage Examples

### **Scenario 1: Staff Member Needs to Contact Admin**

1. Staff member opens direct messaging
2. Sees online Admin users
3. Clicks on Admin to start conversation
4. Sends private message
5. Admin receives notification and can respond

### **Scenario 2: Admin Assigns Task via Direct Message**

1. Admin opens direct messaging
2. Selects specific staff member
3. Sends private message with task details
4. Staff member gets notification
5. Private conversation continues

### **Scenario 3: Team Coordination**

1. Multiple staff members online
2. Each can have private conversations
3. Group chat still available for project discussions
4. Clear separation between public and private communication

## Benefits

1. **Private Communication**: Sensitive discussions stay private
2. **Task Assignment**: Direct task delegation via messaging
3. **Quick Questions**: Fast 1-on-1 communication
4. **Professional Communication**: Separate from group chat
5. **Message History**: Persistent conversation records
6. **Online Status**: Know who's available for messaging

## Integration with Existing System

- **No Conflicts**: Works alongside existing group chat
- **Same Server**: Uses existing Socket.io server
- **Same Database**: Uses existing Supabase setup
- **Same Authentication**: Uses existing user system
- **Role-Based**: Respects existing Admin/Staff/Client roles

The direct messaging system is designed to complement your existing group chat, not replace it. Users can switch between group discussions and private conversations as needed.
