import { useState, useRef, useEffect } from "react";
import { SmileIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// Common emojis for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageReactions = ({ message, showButton }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { addReaction } = useChatStore();
  const { authUser } = useAuthStore();
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle adding a reaction
  const handleReactionClick = (emoji) => {
    addReaction(message._id, emoji);
    setShowEmojiPicker(false);
  };

  // Get formatted reactions from message
  const getFormattedReactions = () => {
    if (!message.reactions) return [];
    
    return Object.entries(message.reactions).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      hasReacted: users.includes(authUser._id)
    }));
  };

  // Check if user has already reacted
  const getUserReaction = () => {
    if (!message.reactions) return null;
    
    for (const [emoji, users] of Object.entries(message.reactions)) {
      if (users.includes(authUser._id)) {
        return emoji;
      }
    }
    return null;
  };

  const reactions = getFormattedReactions();
  const userReaction = getUserReaction();

  return (
    <div className="relative">
      {/* Display existing reactions */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {reactions.map(({ emoji, count, hasReacted }) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`rounded-full px-2 py-0.5 text-xs flex items-center ${
                hasReacted 
                  ? "bg-primary/20 text-primary" 
                  : "bg-base-300/30 text-base-content"
              }`}
            >
              <span className="mr-1">{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Only show button if requested */}
      {showButton && (
        <button 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`ml-2 p-1.5 rounded-full transition-colors ${
            userReaction 
              ? "bg-primary/20 text-primary" 
              : "text-base-content/60 hover:bg-base-300/30"
          }`}
          title="React to message"
        >
          {userReaction ? (
            <span>{userReaction}</span>
          ) : (
            <SmileIcon size={16} />
          )}
        </button>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef} 
          className="absolute bottom-8 right-0 bg-base-100 shadow-lg rounded-lg p-2 z-10 border border-base-300"
        >
          <div className="flex gap-2">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`w-8 h-8 flex items-center justify-center hover:bg-base-200 rounded-full transition-colors ${
                  userReaction === emoji ? "bg-primary/20 text-primary" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageReactions; 