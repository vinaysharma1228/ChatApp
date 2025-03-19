import React from "react";

const EmojiPicker = ({ onEmojiSelect, showCloseButton = false, onClose }) => {
  // Common emoji sets for reactions
  const emojis = [
    "👍", "👎", "❤️", "😂", "😮", "😢", "😡", 
    "🎉", "👀", "🔥", "💯", "✅", "👏", "🙏"
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
      <div className="flex flex-wrap gap-2 max-w-[200px]">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {emoji}
          </button>
        ))}
        
        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker; 