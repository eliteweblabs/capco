import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:4321",
    "http://localhost:3000",
    "https://capcofire.com",
    "https://your-domain.com", // Add your production domain
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ [SOCKETIO-CHAT] Missing Supabase environment variables");
  console.error("Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// In-memory storage for active users and messages
const activeUsers = new Map();
const chatHistory = [];

// Load recent messages from database on startup
async function loadRecentMessages() {
  try {
    console.log("🔔 [SOCKETIO-CHAT] Loading recent messages from database...");

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("❌ [SOCKETIO-CHAT] Error loading messages:", error);
      return;
    }

    if (messages) {
      chatHistory.push(...messages.reverse());
      console.log(`✅ [SOCKETIO-CHAT] Loaded ${messages.length} messages from database`);
    }
  } catch (error) {
    console.error("❌ [SOCKETIO-CHAT] Error loading messages:", error);
  }
}

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔔 [SOCKETIO-CHAT] User connected: ${socket.id}`);

  // Handle user joining
  socket.on("join", async (userData) => {
    const { userId, userName, userRole } = userData;

    console.log(`🔔 [SOCKETIO-CHAT] User joining: ${userName} (${userRole})`);

    // Store user info
    activeUsers.set(socket.id, {
      userId,
      userName,
      userRole,
      socketId: socket.id,
      joinedAt: new Date(),
    });

    // Send chat history to the new user
    socket.emit("chat_history", chatHistory);

    // Broadcast updated user list
    const userList = Array.from(activeUsers.values());
    io.emit("user_list", userList);

    // Broadcast user joined message
    socket.broadcast.emit("user_joined", {
      userName,
      userRole,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ [SOCKETIO-CHAT] User ${userName} joined successfully`);
  });

  // Handle new messages
  socket.on("message", async (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      console.error("❌ [SOCKETIO-CHAT] User not found for socket:", socket.id);
      return;
    }

    const { message } = messageData;
    const messageObj = {
      id: Date.now().toString(),
      user_id: user.userId,
      user_name: user.userName,
      user_role: user.userRole,
      message: message,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    console.log(`🔔 [SOCKETIO-CHAT] New message from ${user.userName}: ${message}`);

    // Add to chat history
    chatHistory.push(messageObj);

    // Keep only last 100 messages in memory
    if (chatHistory.length > 100) {
      chatHistory.shift();
    }

    // Save to database
    try {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.userId,
        user_name: user.userName,
        user_role: user.userRole,
        message: message,
        timestamp: messageObj.timestamp,
      });

      if (error) {
        console.error("❌ [SOCKETIO-CHAT] Error saving message to database:", error);
      } else {
        console.log("✅ [SOCKETIO-CHAT] Message saved to database");
      }
    } catch (error) {
      console.error("❌ [SOCKETIO-CHAT] Error saving message:", error);
    }

    // Broadcast message to all connected users
    io.emit("new_message", messageObj);
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit("user_typing", {
        userName: user.userName,
        isTyping: data.isTyping,
      });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`🔔 [SOCKETIO-CHAT] User disconnected: ${user.userName}`);

      // Remove from active users
      activeUsers.delete(socket.id);

      // Broadcast updated user list
      const userList = Array.from(activeUsers.values());
      io.emit("user_list", userList);

      // Broadcast user left message
      socket.broadcast.emit("user_left", {
        userName: user.userName,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle heartbeat/ping
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

// Clean up old messages from database (run daily)
setInterval(
  async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (error) {
        console.error("❌ [SOCKETIO-CHAT] Error cleaning old messages:", error);
      } else {
        console.log("✅ [SOCKETIO-CHAT] Cleaned old messages from database");
      }
    } catch (error) {
      console.error("❌ [SOCKETIO-CHAT] Error cleaning messages:", error);
    }
  },
  24 * 60 * 60 * 1000
); // Run every 24 hours

// Start server
const PORT = process.env.CHAT_PORT || 3001;

// Load recent messages and start server
loadRecentMessages().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 [SOCKETIO-CHAT] Socket.io chat server running on port ${PORT}`);
    console.log(`🔗 [SOCKETIO-CHAT] CORS enabled for: ${corsOptions.origin.join(", ")}`);
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🔔 [SOCKETIO-CHAT] Shutting down chat server...");
  server.close(() => {
    console.log("✅ [SOCKETIO-CHAT] Chat server stopped");
    process.exit(0);
  });
});
