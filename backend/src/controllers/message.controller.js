import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate("replyTo", "text senderId"); // Populate reply information
    
    // Filter out messages deleted for the current user
    const filteredMessages = messages.filter(message => 
      !message.deletedFor.includes(myId)
    );

    // Mark messages as delivered if they were sent to current user and not already seen
    const messagesToMark = filteredMessages.filter(
      msg => 
        msg.receiverId.toString() === myId.toString() && 
        msg.status !== "seen"
    );

    if (messagesToMark.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: messagesToMark.map(msg => msg._id) },
          status: { $ne: "seen" }
        },
        { 
          status: "delivered",
          deliveredAt: new Date()
        }
      );

      // Notify the sender that messages were delivered
      const receiverSocketId = getReceiverSocketId(userToChatId);
      if (receiverSocketId) {
        messagesToMark.forEach(msg => {
          io.to(receiverSocketId).emit("messageDelivered", { 
            messageId: msg._id, 
            deliveredAt: new Date() 
          });
        });
      }
    }

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyToId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Create message data
    const messageData = {
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: "sent"
    };

    // Add reply data if this is a reply
    if (replyToId) {
      const replyToMessage = await Message.findById(replyToId);
      if (replyToMessage) {
        messageData.isReply = true;
        messageData.replyTo = replyToId;
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Populate the replyTo field if needed
    if (replyToId) {
      await newMessage.populate("replyTo", "text senderId");
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as seen if the current user is the recipient
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark this message as seen" });
    }

    // Update message status
    message.status = "seen";
    message.seenAt = new Date();
    await message.save();

    // Notify the sender
    const senderSocketId = getReceiverSocketId(message.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", { 
        messageId: message._id, 
        seenAt: message.seenAt 
      });
    }

    res.status(200).json({ message: "Message marked as seen" });
  } catch (error) {
    console.log("Error in markMessageSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow editing of own messages
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    // Check 15-minute time limit for editing
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    if (timeDifference > 15) {
      return res.status(400).json({ error: "Cannot edit messages older than 15 minutes" });
    }

    // Save the original text to edit history
    if (!message.isEdited) {
      message.editHistory = [{
        text: message.text,
        editedAt: message.createdAt
      }];
    } else {
      message.editHistory.push({
        text: message.text,
        editedAt: new Date()
      });
    }

    // Update the message
    message.text = text;
    message.isEdited = true;
    await message.save();

    // Notify the receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body; // "everyone" or "me"
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (deleteType === "everyone") {
      // Only message sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Unauthorized to delete this message for everyone" });
      }

      message.isDeleted = true;
      await message.save();

      // Notify the receiver
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId: message._id,
          deleteType: "everyone"
        });
      }
    } else if (deleteType === "me") {
      // Anyone can delete for themselves
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    } else {
      return res.status(400).json({ error: "Invalid delete type" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id.toString();

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get current reactions or initialize empty map
    const reactions = message.reactions || new Map();
    
    // Get users who reacted with this emoji
    let emojiReactions = reactions.get(emoji) || [];
    
    // Check if user already reacted with this emoji
    const userIndex = emojiReactions.findIndex(id => id.toString() === userId);
    
    if (userIndex !== -1) {
      // User already reacted with this emoji, remove the reaction
      emojiReactions.splice(userIndex, 1);
    } else {
      // Add new reaction
      emojiReactions.push(userId);
    }
    
    // Update reactions in the database
    if (emojiReactions.length === 0) {
      // Remove emoji key if no reactions left
      reactions.delete(emoji);
    } else {
      reactions.set(emoji, emojiReactions);
    }
    
    message.reactions = reactions;
    await message.save();

    // Notify both users about the reaction update
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", { messageId, reactions: Object.fromEntries(reactions) });
    }
    
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageReaction", { messageId, reactions: Object.fromEntries(reactions) });
    }

    res.status(200).json({ messageId, reactions: Object.fromEntries(reactions) });
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
