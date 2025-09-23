import { handler as ssrHandler } from './dist/server/entry.mjs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:4321",
    "http://localhost:3000", 
    "https://capcofire.com",
    process.env.SITE_URL,
  ].filter(Boolean),
  credentials: true,
};

app.use(cors(corsOptions));

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  path: "/socket.io/"
});

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ [SOCKETIO-INTEGRATION] Missing Supabase environment variables");
  console.error("Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory storage for active users and messages
const activeUsers = new Map();
const chatHistory = [];
const directMessages = new Map();

// Load recent messages from database on startup
async function loadRecentMessages() {
  try {
    console.log("🔔 [SOCKETIO-INTEGRATION] Loading recent messages from database...");
    
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ [SOCKETIO-INTEGRATION] Error loading messages:", error);
      return;
    }

    // Reverse to get chronological order
    chatHistory.push(...(messages || []).reverse());
    console.log(`✅ [SOCKETIO-INTEGRATION] Loaded ${chatHistory.length} messages from database`);
  } catch (error) {
    console.error("❌ [SOCKETIO-INTEGRATION] Error in loadRecentMessages:", error);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔔 [SOCKETIO-INTEGRATION] User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (data) => {
    console.log(`🔔 [SOCKETIO-INTEGRATION] User joined:`, data);
    
    activeUsers.set(socket.id, {
      ...data,
      socketId: socket.id,
      joinedAt: new Date().toISOString(),
    });

    // Send chat history to new user
    socket.emit('chat_history', chatHistory);
    
    // Update user list for all clients
    io.emit('user_list', Array.from(activeUsers.values()));
    
    // Notify others of new user
    socket.broadcast.emit('user_joined', data);
  });

  // Handle new messages
  socket.on('send_message', async (messageData) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        console.error("❌ [SOCKETIO-INTEGRATION] User not found for socket:", socket.id);
        return;
      }

      const message = {
        id: Date.now().toString(),
        message: messageData.message,
        user_id: user.userId,
        user_name: user.userName,
        user_role: user.userRole,
        created_at: new Date().toISOString(),
      };

      // Save to database
      const { error } = await supabase
        .from('chat_messages')
        .insert([message]);

      if (error) {
        console.error("❌ [SOCKETIO-INTEGRATION] Error saving message:", error);
      }

      // Add to local history
      chatHistory.push(message);
      
      // Keep only last 50 messages in memory
      if (chatHistory.length > 50) {
        chatHistory.shift();
      }

      // Broadcast to all users
      io.emit('new_message', message);
      
      console.log(`💬 [SOCKETIO-INTEGRATION] Message from ${user.userName}: ${messageData.message}`);
    } catch (error) {
      console.error("❌ [SOCKETIO-INTEGRATION] Error handling message:", error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', { 
        userId: user.userId, 
        userName: user.userName,
        isTyping: true 
      });
    }
  });

  socket.on('typing_stop', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', { 
        userId: user.userId, 
        userName: user.userName,
        isTyping: false 
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔔 [SOCKETIO-INTEGRATION] User disconnected: ${socket.id}`);
    
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      
      // Update user list for remaining clients
      io.emit('user_list', Array.from(activeUsers.values()));
      
      // Notify others of user leaving
      socket.broadcast.emit('user_left', user);
    }
  });
});

// Use Astro's SSR handler for all other requests
app.use(ssrHandler);

// Start the server
const PORT = process.env.PORT || 4321;

// Load messages and start server
loadRecentMessages().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 [SOCKETIO-INTEGRATION] Server running on port ${PORT}`);
    console.log(`🔗 [SOCKETIO-INTEGRATION] Socket.io enabled with CORS: ${corsOptions.origin.join(", ")}`);
  });
});
