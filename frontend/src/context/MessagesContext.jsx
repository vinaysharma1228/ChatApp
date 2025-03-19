import { createContext, useContext, useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketContext } from "./SocketContext";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";

const MessagesContext = createContext();

export const useMessagesContext = () => {
  return useContext(MessagesContext);
};

export const MessagesContextProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedConversation?._id === newMessage.senderId) {
        setMessages((prev) => [...prev, newMessage]);
        
        // Mark the message as delivered immediately
        markMessageAsDelivered(newMessage._id);
      }
    };

    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, status: "delivered", deliveredAt } 
            : message
        )
      );
    };

    const handleMessageSeen = ({ messageId, seenAt }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, status: "seen", seenAt } 
            : message
        )
      );
    };

    const handleMessageEdited = (updatedMessage) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === updatedMessage._id 
            ? updatedMessage 
            : message
        )
      );
    };

    const handleMessageDeleted = ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        setMessages((prev) => 
          prev.map((message) => 
            message._id === messageId 
              ? { ...message, isDeleted: true } 
              : message
          )
        );
      } else {
        // For "me" deletion, message will be filtered out when the messages are fetched again
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, reactions } 
            : message
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageSeen", handleMessageSeen);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageSeen", handleMessageSeen);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReaction", handleMessageReaction);
    };
  }, [socket, selectedConversation, authUser]);

  useEffect(() => {
    const getConversations = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/messages/users");
        setConversations(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching conversations");
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, []);

  const sendMessage = async (receiverId, message, image, replyToId) => {
    try {
      const res = await fetch(`/api/messages/send/${receiverId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message, image, replyToId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error sending message");
      }
      return data;
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const getMessages = async (conversationId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
        
        // Mark messages as seen
        const receivedMessages = data.filter(msg => 
          msg.senderId === conversationId && msg.status !== "seen"
        );
        
        for (const msg of receivedMessages) {
          markMessageAsSeen(msg._id);
        }
      } else {
        throw new Error(data.error || "Error fetching messages");
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsDelivered = async (messageId) => {
    try {
      // This happens automatically on the backend when fetching messages
      // The backend will emit socket events for delivery status
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  };

  const markMessageAsSeen = async (messageId) => {
    try {
      const res = await fetch(`/api/messages/seen/${messageId}`, {
        method: "PUT",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error marking message as seen");
      }
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      const res = await fetch(`/api/messages/edit/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newText }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error editing message");
      }
      
      // Update message locally
      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? data : msg)
      );
      
      return data;
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const deleteMessage = async (messageId, deleteType) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteType }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error deleting message");
      }
      
      // Update messages locally
      if (deleteType === "everyone") {
        setMessages(prev => 
          prev.map(msg => msg._id === messageId ? { ...msg, isDeleted: true } : msg)
        );
      } else {
        // For "me" deletion, remove the message from the array
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const res = await fetch(`/api/messages/reaction/${messageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error adding reaction");
      }
      
      // Update message with reaction data locally
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const value = {
    messages,
    loading,
    error,
    selectedConversation,
    setSelectedConversation,
    conversations,
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    addReaction,
    replyTo,
    setReplyTo,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export default MessagesContext; 