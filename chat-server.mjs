import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4321", "http://localhost:3000", "https://de.capcofire.com"],
    methods: ["GET", "POST"],
  },
});

// Enable CORS
app.use(cors());

// Store connected users
const connectedUsers = new Map();
const chatHistory = [];

// Socket connection handling
io.on("connection", (socket) => {
  console.log(`🔔 [CHAT-SERVER] User connected: ${socket.id}`);

  // User joins chat
  socket.on("join", (userData) => {
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
    if (chatHistory.length > 0) {
      socket.emit("chatHistory", chatHistory.slice(-50)); // Last 50 messages
    }

    console.log(`🔔 [CHAT-SERVER] Total users online: ${connectedUsers.size}`);
  });

  // Handle chat messages
  socket.on("message", (messageData) => {
    console.log(`🔔 [CHAT-SERVER] Message from ${messageData.userName}: ${messageData.message}`);

    // Store message in history
    const fullMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    chatHistory.push(fullMessage);

    // Keep only last 100 messages
    if (chatHistory.length > 100) {
      chatHistory.shift();
    }

    // Broadcast message to all users
    io.emit("message", fullMessage);
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
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    usersOnline: connectedUsers.size,
    totalMessages: chatHistory.length,
  });
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

const PORT = process.env.CHAT_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 [CHAT-SERVER] Chat server running on port ${PORT}`);
  console.log(
    `🔔 [CHAT-SERVER] CORS enabled for: http://localhost:4321, http://localhost:3000, https://de.capcofire.com`
  );
});

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
