import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    reactions: {
      type: Map,
      of: {
        type: Array,
        default: [],
      },
      default: new Map(),
    },
    // Fields for reply functionality
    isReply: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Fields for edit functionality
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        text: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Fields for delete functionality
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Fields for message status tracking
    status: {
      type: String,
      enum: ["sent", "unsent", "delivered", "seen"],
      default: "sent",
    },
    seenAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
