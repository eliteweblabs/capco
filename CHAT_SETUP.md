# 🚀 Team Chat Setup Guide

## Overview
This guide will help you set up the real-time team chat functionality for CAPCo Fire Protection Systems. The chat is a floating widget that appears in the bottom-left corner for Admin/Staff users only.

## ✨ Features
- **Real-time messaging** between team members
- **Online presence** indicators
- **Typing indicators** 
- **Chat history** (last 100 messages)
- **Admin/Staff only** access
- **Responsive design** that matches your app

## 🛠️ Setup Steps

### 1. Install Chat Server Dependencies
```bash
# Navigate to your project root
cd /Users/4rgd/Astro/astro-supabase-main

# Install chat server dependencies
npm install express socket.io cors
npm install --save-dev nodemon
```

### 2. Start the Chat Server
```bash
# Start the chat server (development mode)
node chat-server.js

# Or use nodemon for auto-restart during development
npx nodemon chat-server.js
```

The chat server will run on port 3001 by default.

### 3. Test the Chat
1. **Open your app** in multiple browser tabs/windows
2. **Login as Admin/Staff** users
3. **Look for the chat icon** in the bottom-left corner
4. **Click the icon** to open the chat widget
5. **Start chatting** between different users

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Change chat server port
CHAT_PORT=3001
```

### CORS Settings
The chat server is configured to allow connections from:
- `http://localhost:4321` (local development)
- `http://localhost:3000` (alternative local port)
- `https://de.capcofire.com` (your live domain)

## 📱 How It Works

### Frontend (ChatWidget.astro)
- **Fixed positioning** bottom-left corner
- **Role-based visibility** (Admin/Staff only)
- **Socket.io client** for real-time communication
- **Responsive design** with dark mode support

### Backend (chat-server.js)
- **Express server** with Socket.io
- **User management** (online/offline tracking)
- **Message broadcasting** to all connected users
- **Chat history** storage (in-memory, last 100 messages)

## 🎨 Customization

### Styling
The chat widget uses Tailwind CSS classes and can be easily customized:
- **Colors**: Change `bg-red-600` to match your brand
- **Size**: Modify `w-80 h-96` for different dimensions
- **Position**: Adjust `bottom-4 left-4` for placement

### Features
Add more features by modifying the chat server:
- **Persistent storage** (database integration)
- **File sharing** (image/document uploads)
- **User typing** (more sophisticated indicators)
- **Read receipts** (message status tracking)

## 🚨 Troubleshooting

### Chat Widget Not Visible
- Check if user has Admin/Staff role
- Verify chat server is running on port 3001
- Check browser console for errors

### Connection Issues
- Ensure chat server is running
- Check CORS settings match your domain
- Verify firewall/network settings

### Messages Not Sending
- Check Socket.io connection status
- Verify user authentication
- Check browser console for errors

## 🔒 Security Notes

- **Admin/Staff only** - Clients cannot see or access the chat
- **No persistent storage** - Messages are stored in-memory only
- **CORS protected** - Only allows connections from specified domains
- **User validation** - Server validates user roles before allowing access

## 📈 Scaling Considerations

For your current needs (5 team members), the current setup is perfect. If you need to scale:

- **Database integration** for persistent message storage
- **Redis** for user session management
- **Load balancing** for multiple chat servers
- **Message queuing** for high-volume scenarios

## 🎯 Next Steps

1. **Test the basic functionality** with multiple users
2. **Customize the styling** to match your brand
3. **Add any additional features** you need
4. **Deploy the chat server** to your production environment

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the chat server is running and accessible
3. Check user roles and permissions
4. Review the CORS and network settings

---

**Happy Chatting! 🎉**
