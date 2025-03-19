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
  sendMessage: async (receiverId, text, attachment, attachmentType, replyToId) => {
    // Create a temporary message ID for local tracking
    const tempId = `temp-${Date.now()}`;
    const authUser = useAuthStore.getState().authUser;
    
    // Create a temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId,
      text: text || "",
      status: "sending",
      createdAt: new Date().toISOString(),
      uploadProgress: attachment ? 0 : null,
      isUploading: !!attachment,
      tempAttachment: null,
    };
    
    // Add specific attachment properties based on type
    if (attachment) {
      if (attachmentType === 'image') {
        // For images, use the imagePreview data URL for immediate display
        if (typeof attachment === 'string' && attachment.startsWith('data:image')) {
          tempMessage.image = attachment;
        } else {
          // If it's a file, create a local URL for preview
          tempMessage.image = URL.createObjectURL(attachment);
        }
      } else if (attachmentType === 'voice') {
        // For voice messages, create a local URL for playback
        tempMessage.type = 'voice';
        tempMessage.tempAttachment = URL.createObjectURL(attachment);
        tempMessage.duration = attachment.duration || 0;
      } else if (attachmentType === 'document') {
        // For documents, just store the file name
        tempMessage.type = 'document';
        tempMessage.fileName = attachment.name;
      }
    }
    
    // If this is a reply, add reply data
    if (replyToId) {
      const messages = get().messages;
      const replyToMessage = messages.find(msg => msg._id === replyToId);
      if (replyToMessage) {
        tempMessage.isReply = true;
        tempMessage.replyTo = replyToMessage;
      }
    }
    
    // Add the temporary message to the UI immediately
    set(state => ({
      messages: [...state.messages, tempMessage]
    }));
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("text", text || "");
      if (replyToId) formData.append("replyToId", replyToId);
      
      // Handle different types of attachments
      if (attachment) {
        // If it's a base64 image string (from imagePreview)
        if (typeof attachment === 'string' && attachment.startsWith('data:image')) {
          // Convert base64 to blob
          const response = await fetch(attachment);
          const blob = await response.blob();
          formData.append("attachment", blob, "image.jpg");
          formData.append("attachmentType", "image");
        } 
        // If it's a file object
        else if (attachment instanceof Blob || attachment instanceof File) {
          formData.append("attachment", attachment, attachment.name || "file");
          formData.append("attachmentType", attachmentType || "document");
          
          // If this is a voice message, also include the duration explicitly
          if (attachmentType === 'voice' && attachment.duration) {
            formData.append("duration", attachment.duration.toString());
            console.log("Sending voice message with duration:", attachment.duration);
          }
        }
      }
      
      // Send the actual request with upload progress tracking
      const res = await axiosInstance.post(`/api/messages/send/${receiverId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Calculate and update progress percentage
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // Update the temporary message with upload progress
            set(state => ({
              messages: state.messages.map(msg => 
                msg._id === tempId 
                  ? { ...msg, uploadProgress: progress }
                  : msg
              )
            }));
          }
        }
      });
      
      // Update the temporary message with the real message data after upload
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? { ...res.data, uploadProgress: 100, isUploading: false } : msg
        ),
        replyTo: null,
      }));

      return res.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Update the temporary message to show error status
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: "error", isUploading: false, hasError: true }
            : msg
        )
      }));
      
      toast.error(error.response?.data?.message || "Error sending message");
      throw error;
    }
  },

  // Add a new function to retry failed uploads
  retryMessageUpload: async (messageId) => {
    try {
      // Find the failed message
      const failedMessage = get().messages.find(msg => msg._id === messageId);
      if (!failedMessage) return;
      
      // Reset status to sending and uploading
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, status: "sending", isUploading: true, uploadProgress: 0, hasError: false }
            : msg
        )
      }));
      
      // Extract necessary data for resending
      const { receiverId, text, image, tempAttachment, type, replyTo } = failedMessage;
      
      // Recreate attachment from temporary data
      let attachment = null;
      let attachmentType = null;
      
      if (image && image.startsWith('blob:')) {
        // We need to retrieve the file from the cache
        try {
          const response = await fetch(image);
          attachment = await response.blob();
          attachmentType = 'image';
        } catch (err) {
          console.error("Failed to retrieve cached image:", err);
        }
      } else if (tempAttachment && type === 'voice') {
        try {
          const response = await fetch(tempAttachment);
          attachment = await response.blob();
          attachmentType = 'voice';
        } catch (err) {
          console.error("Failed to retrieve cached audio:", err);
        }
      }
      
      // Call the regular send function with the retrieved data
      await get().sendMessage(
        receiverId, 
        text, 
        attachment, 
        attachmentType, 
        replyTo?._id
      );
      
      // Remove the original failed message
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== messageId)
      }));
      
    } catch (error) {
      console.error("Failed to retry message upload:", error);
      toast.error("Failed to retry message upload");
    }
  },

  // Mark a message as delivered
  markMessageAsDelivered: async (messageId) => {
    try {
      const response = await axiosInstance.put(`/api/messages/delivered/${messageId}`);
      
      // Update the message in our local state
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered", deliveredAt: new Date() } : msg
        ),
      }));

      // Emit socket event to notify the sender
      const socket = get().socket;
      if (socket) {
        socket.emit("messageDelivered", { 
          messageId, 
          deliveredAt: new Date() 
        });
      }
      
      return response.data;
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
        setTimeout(() => {
          get().markMessageAsDelivered(message._id);
        }, 1000);
      }
    };

    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "delivered", deliveredAt: new Date(deliveredAt) }
            : message
        ),
      }));
    };

    const handleMessageSeen = ({ messageId, seenAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "seen", seenAt: new Date(seenAt) }
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
