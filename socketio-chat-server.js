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
    process.env.SITE_URL, // Use production site URL from environment
  ].filter(Boolean), // Remove any undefined values
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
const directMessages = new Map(); // Store direct messages by conversation ID

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
    console.log(`🔧 [SOCKETIO-CHAT] User data received:`, {
      userId,
      userName,
      userRole,
      socketId: socket.id,
    });

    // Check if userId is valid
    if (!userId || userId === "unknown" || userId === "undefined") {
      console.error("❌ [SOCKETIO-CHAT] Invalid userId received:", userId);
      console.error("🔧 [SOCKETIO-CHAT] Full userData:", userData);
    }

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

    // Broadcast updated user list to all users
    const userList = Array.from(activeUsers.values());
    console.log(
      `🔧 [SOCKETIO-CHAT] Broadcasting user list to all users:`,
      userList.length,
      "users"
    );
    io.emit("user_list", userList);

    // Broadcast user joined message
    socket.broadcast.emit("user_joined", {
      userName,
      userRole,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ [SOCKETIO-CHAT] User ${userName} joined successfully`);
  });

  // Handle direct messaging join
  socket.on("join_dm", async (userData) => {
    const { userId, userName, userRole } = userData;

    console.log(`💬 [DIRECT-MESSAGING] User joining DM: ${userName} (${userRole})`);

    // Store user info (same as regular join)
    activeUsers.set(socket.id, {
      userId,
      userName,
      userRole,
      socketId: socket.id,
      joinedAt: new Date(),
    });

    // Send DM user list to all connected users
    const userList = Array.from(activeUsers.values());
    console.log(
      `🔧 [DIRECT-MESSAGING] Broadcasting user list to all users:`,
      userList.length,
      "users"
    );
    io.emit("dm_user_list", userList);

    console.log(`✅ [DIRECT-MESSAGING] User ${userName} joined DM successfully`);
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

  // Handle direct messages
  socket.on("dm_message", async (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      console.error("❌ [DIRECT-MESSAGING] User not found for socket:", socket.id);
      return;
    }

    const { to, message } = messageData;
    const messageObj = {
      id: Date.now().toString(),
      from: user.userId,
      from_name: user.userName,
      to: to,
      message: message,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    console.log(`💬 [DIRECT-MESSAGING] DM from ${user.userName} to ${to}: ${message}`);
    console.log(`🔧 [DIRECT-MESSAGING] User data:`, {
      userId: user.userId,
      userName: user.userName,
      userRole: user.userRole,
    });

    // Store in direct messages
    const conversationId = [user.userId, to].sort().join("-");
    if (!directMessages.has(conversationId)) {
      directMessages.set(conversationId, []);
    }
    directMessages.get(conversationId).push(messageObj);

    // Keep only last 50 messages per conversation
    const conversation = directMessages.get(conversationId);
    if (conversation.length > 50) {
      conversation.shift();
    }

    // Save to database
    try {
      console.log("🔧 [DIRECT-MESSAGING] Attempting to save DM to database:", {
        from_user: user.userId,
        from_name: user.userName,
        to_user: to,
        message: message,
        message_timestamp: messageObj.timestamp,
      });

      // First check if both users exist in auth.users
      const { data: fromUser, error: fromUserError } = await supabase
        .from("auth.users")
        .select("id")
        .eq("id", user.userId)
        .single();

      const { data: toUser, error: toUserError } = await supabase
        .from("auth.users")
        .select("id")
        .eq("id", to)
        .single();

      if (fromUserError || toUserError) {
        console.error("❌ [DIRECT-MESSAGING] User validation failed:", {
          fromUserError: fromUserError?.message,
          toUserError: toUserError?.message,
          fromUserId: user.userId,
          toUserId: to,
        });
        return;
      }

      const { error } = await supabase.from("direct_messages").insert({
        from_user: user.userId,
        from_name: user.userName,
        to_user: to,
        message: message,
        message_timestamp: messageObj.timestamp,
      });

      if (error) {
        console.error("❌ [DIRECT-MESSAGING] Error saving DM to database:", error);
        console.error("🔧 [DIRECT-MESSAGING] Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else {
        console.log("✅ [DIRECT-MESSAGING] DM saved to database");
      }
    } catch (error) {
      console.error("❌ [DIRECT-MESSAGING] Error saving DM:", error);
      console.error("🔧 [DIRECT-MESSAGING] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }

    // Send to recipient if online
    const recipientSocket = Array.from(activeUsers.entries()).find(
      ([_, userData]) => userData.userId === to
    );
    if (recipientSocket) {
      recipientSocket[0].emit("dm_message", messageObj);
    }

    // Send back to sender for confirmation
    socket.emit("dm_message", messageObj);
  });

  // Handle DM conversation history request
  socket.on("get_dm_history", (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { userId } = data;
    const conversationId = [user.userId, userId].sort().join("-");
    const conversation = directMessages.get(conversationId) || [];

    console.log(
      `💬 [DIRECT-MESSAGING] Sending DM history to ${user.userName}: ${conversation.length} messages`
    );
    socket.emit("dm_conversation_history", { messages: conversation });
  });

  // Handle DM typing indicators
  socket.on("dm_typing", (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { to, isTyping } = data;

    // Send typing indicator to recipient
    const recipientSocket = Array.from(activeUsers.entries()).find(
      ([_, userData]) => userData.userId === to
    );
    if (recipientSocket) {
      recipientSocket[0].emit("dm_user_typing", {
        from: user.userId,
        from_name: user.userName,
        isTyping: isTyping,
      });
    }
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

      // Broadcast updated user list to all users
      const userList = Array.from(activeUsers.values());
      console.log(
        `🔧 [SOCKETIO-CHAT] Broadcasting updated user list after disconnect:`,
        userList.length,
        "users"
      );
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
