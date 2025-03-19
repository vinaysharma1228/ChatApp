import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  selectedUser: null,
  messages: [],
  users: [],
  isMessagesLoading: false,
  isUsersLoading: false,
  replyTo: null,
  socket: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // Get all users for the sidebar
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
      console.error("Error fetching users:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get messages between the current user and the selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`);
      set({ messages: res.data });

      // Mark messages as seen if they're from the other user
      const receivedMessages = res.data.filter(
        (msg) => msg.senderId === userId && msg.status !== "seen"
      );
      
      for (const msg of receivedMessages) {
        get().markMessageAsSeen(msg._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message to another user
  sendMessage: async (receiverId, message, image, replyToId) => {
    try {
      const res = await axiosInstance.post(`/api/messages/send/${receiverId}`, {
        text: message, 
        image, 
        replyToId
      });
      
      set((state) => ({
        messages: [...state.messages, res.data],
        replyTo: null,
      }));

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
      throw error;
    }
  },

  // Mark a message as delivered
  markMessageAsDelivered: async (messageId) => {
    try {
      // This could be implemented if needed
      console.log("Message marked as delivered:", messageId);
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  },

  // Mark a message as seen
  markMessageAsSeen: async (messageId) => {
    try {
      await axiosInstance.put(`/api/messages/seen/${messageId}`);
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  },

  // Edit a message
  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/api/messages/edit/${messageId}`, {
        text: newText
      });

      // Update message locally
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      }));

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error editing message");
      throw error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId, deleteType) => {
    try {
      await axiosInstance.delete(`/api/messages/${messageId}`, {
        data: { deleteType }
      });

      // Update messages locally
      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, isDeleted: true } : msg
          ),
        }));
      } else {
        // For "me" deletion, remove the message from the array
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== messageId),
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting message");
      throw error;
    }
  },

  // Add or remove a reaction from a message
  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/api/messages/reaction/${messageId}`, {
        emoji
      });

      // Update message with reaction data locally
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding reaction");
    }
  },

  // Set reply state for replying to messages
  setReplyTo: (replyData) => set({ replyTo: replyData }),

  // Set socket reference
  setSocket: (socket) => set({ socket }),

  // Subscribe to socket events for real-time message updates
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    set({ socket }); // Store the socket reference

    const handleNewMessage = (message) => {
      // Check if message is from the selected user
      if (get().selectedUser?._id === message.senderId) {
        set((state) => ({ messages: [...state.messages, message] }));
        
        // Mark the message as delivered immediately
        get().markMessageAsDelivered(message._id);
      }
    };

    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "delivered", deliveredAt }
            : message
        ),
      }));
    };

    const handleMessageSeen = ({ messageId, seenAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "seen", seenAt }
            : message
        ),
      }));
    };

    const handleMessageEdited = (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message
        ),
      }));
    };

    const handleMessageDeleted = ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((message) =>
            message._id === messageId
              ? { ...message, isDeleted: true }
              : message
          ),
        }));
      } else {
        // For "me" deletion, message will be filtered out when the messages are fetched again
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? { ...message, reactions } : message
        ),
      }));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageSeen", handleMessageSeen);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);

    // Store the event handlers to remove them later
    set({
      messageEventHandlers: {
        newMessage: handleNewMessage,
        messageDelivered: handleMessageDelivered,
        messageSeen: handleMessageSeen,
        messageEdited: handleMessageEdited,
        messageDeleted: handleMessageDeleted,
        messageReaction: handleMessageReaction,
      },
    });
  },

  // Unsubscribe from socket events
  unsubscribeFromMessages: () => {
    const socket = get().socket;
    const handlers = get().messageEventHandlers;
    if (!socket || !handlers) return;

    socket.off("newMessage", handlers.newMessage);
    socket.off("messageDelivered", handlers.messageDelivered);
    socket.off("messageSeen", handlers.messageSeen);
    socket.off("messageEdited", handlers.messageEdited);
    socket.off("messageDeleted", handlers.messageDeleted);
    socket.off("messageReaction", handlers.messageReaction);

    set({ messageEventHandlers: null });
  },
}));
