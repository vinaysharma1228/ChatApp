import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Handle events for new message functionality
  socket.on("messageDelivered", ({ messageId, deliveredAt }) => {
    socket.broadcast.emit("messageDelivered", { messageId, deliveredAt });
  });

  socket.on("messageSeen", ({ messageId, seenAt }) => {
    socket.broadcast.emit("messageSeen", { messageId, seenAt });
  });

  socket.on("messageEdited", (message) => {
    socket.broadcast.emit("messageEdited", message);
  });

  socket.on("messageDeleted", ({ messageId, deleteType }) => {
    socket.broadcast.emit("messageDeleted", { messageId, deleteType });
  });

  // Handle events for message reactions
  socket.on("messageReaction", ({ messageId, reactions }) => {
    socket.broadcast.emit("messageReaction", { messageId, reactions });
  });

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };


