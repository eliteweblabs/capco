import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4321", "http://localhost:3000", "https://capcofire.com"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
});

// Enable CORS for Express app
app.use(
  cors({
    origin: ["http://localhost:4321", "http://localhost:3000", "https://capcofire.com"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ [CHAT-SERVER] Missing Supabase environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Store connected users
const connectedUsers = new Map();

// Socket connection handling
io.on("connection", (socket) => {
  console.log(`🔔 [CHAT-SERVER] User connected: ${socket.id}`);

  // User joins chat
  socket.on("join", async (userData) => {
    console.log(`🔔 [CHAT-SERVER] User joined: ${userData.userName} (${userData.userId})`);

    // Store user info
    connectedUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
      joinedAt: new Date(),
    });

    // Broadcast user joined to all other users
    socket.broadcast.emit("userJoined", {
      userId: userData.userId,
      userName: userData.userName,
    });

    // Send current online count
    io.emit("onlineCount", connectedUsers.size);

    // Send chat history to new user
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ [CHAT-SERVER] Error loading chat history:", error);
      } else if (messages && messages.length > 0) {
        // Reverse to show oldest first and normalize field names
        const chatHistory = messages.reverse().map((msg) => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.user_name,
          userRole: msg.user_role,
          message: msg.message,
          timestamp: msg.timestamp,
        }));
        socket.emit("chatHistory", chatHistory);
        console.log(`🔔 [CHAT-SERVER] Sent ${chatHistory.length} messages to ${userData.userName}`);
      }
    } catch (error) {
      console.error("❌ [CHAT-SERVER] Error loading chat history:", error);
    }

    console.log(`🔔 [CHAT-SERVER] Total users online: ${connectedUsers.size}`);
  });

  // Handle chat messages
  socket.on("message", async (messageData) => {
    console.log(`🔔 [CHAT-SERVER] Message from ${messageData.userName}: ${messageData.message}`);

    try {
      // Store message in Supabase
      const { data: savedMessage, error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: messageData.userId,
          user_name: messageData.userName,
          user_role: messageData.userRole,
          message: messageData.message,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [CHAT-SERVER] Error saving message:", error);
        // Still broadcast the message even if save fails
        const fullMessage = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        io.emit("message", fullMessage);
      } else {
        // Broadcast the saved message with database ID
        const fullMessage = {
          ...messageData,
          id: savedMessage.id,
          timestamp: savedMessage.timestamp,
        };
        io.emit("message", fullMessage);
        console.log(`✅ [CHAT-SERVER] Message saved to database with ID: ${savedMessage.id}`);
      }
    } catch (error) {
      console.error("❌ [CHAT-SERVER] Error handling message:", error);
      // Fallback: broadcast message without saving
      const fullMessage = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      io.emit("message", fullMessage);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  socket.on("stopTyping", (data) => {
    socket.broadcast.emit("stopTyping", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`🔔 [CHAT-SERVER] User disconnected: ${user.userName} (${user.userId})`);

      // Remove user from connected users
      connectedUsers.delete(socket.id);

      // Broadcast user left to all other users
      socket.broadcast.emit("userLeft", {
        userId: user.userId,
        userName: user.userName,
      });

      // Update online count
      io.emit("onlineCount", connectedUsers.size);

      console.log(`🔔 [CHAT-SERVER] Total users online: ${connectedUsers.size}`);
    }
  });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ [CHAT-SERVER] Error getting message count:", error);
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      usersOnline: connectedUsers.size,
      totalMessages: count || 0,
    });
  } catch (error) {
    console.error("❌ [CHAT-SERVER] Error in health check:", error);
    res.json({
      status: "error",
      timestamp: new Date().toISOString(),
      usersOnline: connectedUsers.size,
      totalMessages: 0,
      error: error.message,
    });
  }
});

// Get online users
app.get("/users", (req, res) => {
  const users = Array.from(connectedUsers.values()).map((user) => ({
    id: user.userId,
    name: user.userName,
    role: user.userRole,
    joinedAt: user.joinedAt,
  }));

  res.json({
    users,
    total: users.length,
  });
});

const PORT = process.env.CHAT_PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [CHAT-SERVER] Chat server running on port ${PORT} (all interfaces)`);
  console.log(
    `🔔 [CHAT-SERVER] CORS enabled for: http://localhost:4321, http://localhost:3000, https://capcofire.com`
  );
});

// Cleanup old messages (keep last 1000, delete older ones)
async function cleanupOldMessages() {
  try {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .lt("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Delete messages older than 30 days

    if (error) {
      console.error("❌ [CHAT-SERVER] Error cleaning up old messages:", error);
    } else {
      console.log("🧹 [CHAT-SERVER] Cleaned up old messages");
    }
  } catch (error) {
    console.error("❌ [CHAT-SERVER] Error in cleanup:", error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldMessages, 60 * 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔔 [CHAT-SERVER] SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("🔔 [CHAT-SERVER] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🔔 [CHAT-SERVER] SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("🔔 [CHAT-SERVER] Server closed");
    process.exit(0);
  });
});
