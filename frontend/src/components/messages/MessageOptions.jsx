import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import EmojiPicker from "./EmojiPicker";
import { useMessagesContext } from "../../context/MessagesContext";
import { useAuthStore } from "../../store/useAuthStore";

const MessageOptions = ({ message, selectedConversation, fromMe }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [replyMode, setReplyMode] = useState(false);
  const dropdownRef = useRef();
  const emojiPickerRef = useRef();
  const editTextRef = useRef();
  
  const { addReaction, editMessage, deleteMessage, setReplyTo } = useMessagesContext();
  const { authUser } = useAuthStore();
  
  useOutsideClick(dropdownRef, () => {
    if (showDropdown) setShowDropdown(false);
  });
  
  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker && !isEditing && !replyMode) setShowEmojiPicker(false);
  });
  
  useEffect(() => {
    if (isEditing && editTextRef.current) {
      editTextRef.current.focus();
    }
  }, [isEditing]);
  
  const handleDropdownClick = () => {
    setShowDropdown(!showDropdown);
    setShowEmojiPicker(false);
  };
  
  const handleReactionClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowDropdown(false);
  };
  
  const handleEmojiSelect = (emoji) => {
    addReaction(message._id, emoji);
  };
  
  const handleReplyClick = () => {
    setReplyTo({
      id: message._id,
      text: message.text,
      senderId: message.senderId,
      senderName: fromMe ? "You" : selectedConversation?.username
    });
    setShowDropdown(false);
    toast.success("Replying to message");
  };
  
  const handleEditClick = () => {
    // Only allow editing within 15 minutes
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    if (timeDifference > 15) {
      toast.error("Cannot edit messages older than 15 minutes");
      return;
    }
    
    setIsEditing(true);
    setShowDropdown(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };
  
  const handleSaveEdit = () => {
    if (editText.trim() === "") {
      toast.error("Message cannot be empty");
      return;
    }
    
    if (editText === message.text) {
      setIsEditing(false);
      return;
    }
    
    editMessage(message._id, editText)
      .then(() => {
        setIsEditing(false);
        toast.success("Message updated");
      })
      .catch((error) => {
        toast.error(error.message || "Failed to update message");
      });
  };
  
  const handleDeleteClick = (deleteType) => {
    deleteMessage(message._id, deleteType)
      .then(() => {
        toast.success(
          deleteType === "everyone" 
            ? "Message deleted for everyone" 
            : "Message deleted for you"
        );
      })
      .catch((error) => {
        toast.error(error.message || "Failed to delete message");
      });
    
    setShowDropdown(false);
  };
  
  const isMessageEditable = () => {
    if (!fromMe) return false;
    
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    return timeDifference <= 15;
  };
  
  // Check if message is recent enough to edit
  const canEdit = isMessageEditable();
  
  // Dropdown position class based on message sender
  const dropdownPositionClass = fromMe ? "right-0" : "left-0";
  
  if (isEditing) {
    return (
      <div className="mt-1 flex items-center">
        <input
          type="text"
          ref={editTextRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <button onClick={handleSaveEdit} className="btn btn-sm btn-primary ml-1">
          Save
        </button>
        <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost ml-1">
          Cancel
        </button>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <button
        onClick={handleDropdownClick}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
          />
        </svg>
      </button>
      
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute ${dropdownPositionClass} mt-1 z-10 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 w-48`}
        >
          <button
            onClick={handleReactionClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
          >
            <span className="mr-2">😀</span>
            React
          </button>
          
          <button
            onClick={handleReplyClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
            </svg>
            Reply
          </button>
          
          {fromMe && canEdit && (
            <button
              onClick={handleEditClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Edit
            </button>
          )}
          
          {fromMe ? (
            <button
              onClick={() => handleDeleteClick("everyone")}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete for Everyone
            </button>
          ) : null}
          
          <button
            onClick={() => handleDeleteClick("me")}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete for Me
          </button>
        </div>
      )}
      
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-8 z-10">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} showCloseButton={true} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
};

export default MessageOptions; 