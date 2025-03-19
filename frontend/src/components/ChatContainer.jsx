import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageReactions from "./MessageReactions";
import MessageOptions from "./MessageOptions";
import ReplyMessage from "./messages/ReplyMessage";
import VoiceMessage, { CompactVoicePlayer } from "./VoiceMessage";
import { File } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    replyTo,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Helper to check if message has reactions
  const hasReactions = (message) => {
    return message.reactions && Object.keys(message.reactions).length > 0;
  };

  // Render message status indicator
  const renderStatusIndicator = (message) => {
    const isOwnMessage = message.senderId === authUser._id;
    if (!isOwnMessage) return null;

    // Handle uploading or error states
    if (message.isUploading) {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending...
        </div>
      );
    } else if (message.hasError) {
      return (
        <div className="text-xs text-error flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Failed to send
        </div>
      );
    }

    // Handle regular message statuses
    if (message.status === "sending" || message.status === "sent") {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Sent
        </div>
      );
    } else if (message.status === "delivered") {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 19l4 4L19 13"></path>
          </svg>
          Delivered
        </div>
      );
    } else if (message.status === "seen") {
      return (
        <div className="text-xs text-blue-500 flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-8H7v2h4v-2zm4-2a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          Seen
        </div>
      );
    }
    
    return null;
  };

  // Render message content based on type
  const renderMessageContent = (message, isOwnMessage) => {
    if (message.isDeleted) {
      return (
        <div className="chat-bubble bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 italic">
          This message was deleted
        </div>
      );
    }

    // Log voice message details for debugging
    if (message.type === 'voice') {
      console.log("Rendering voice message:", {
        id: message._id,
        duration: message.duration,
        attachment: message.attachment,
        tempAttachment: message.tempAttachment
      });
    }

    return (
      <div className="chat-bubble flex flex-col relative">
        {/* Show reply if this is a reply message */}
        {message.isReply && message.replyTo && (
          <ReplyMessage 
            replyData={message.replyTo} 
            senderName={message.senderId === message.replyTo.senderId ? "yourself" : selectedUser?.username} 
          />
        )}
        
        {/* Show upload progress for images */}
        {message.isUploading && message.image && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-gray-300"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="18"
                  cx="24"
                  cy="24"
                />
                <circle
                  className="text-primary"
                  strokeWidth="4"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * message.uploadProgress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="18"
                  cx="24"
                  cy="24"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {message.uploadProgress}%
              </span>
            </div>
          </div>
        )}
        
        {message.image && (
          <img
            src={message.image}
            alt="Attachment"
            className="sm:max-w-[200px] rounded-md mb-2"
          />
        )}

        {message.type === 'voice' && (
          <div className="relative">
            <VoiceMessage
              audioUrl={message.isUploading ? message.tempAttachment : message.attachment}
              duration={message.duration}
              isOwnMessage={message.senderId === authUser._id}
            />
            {/* Show upload progress for voice messages */}
            {message.isUploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${message.uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {message.type === 'document' && (
          <div className="flex items-center gap-2 p-2 bg-base-300 rounded-lg">
            <File size={20} />
            <a
              href={message.isUploading ? message.tempAttachment : message.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline truncate"
            >
              {message.fileName || "Document"}
            </a>
            {/* Show upload progress for documents */}
            {message.isUploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${message.uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-start">
          {/* For own messages (right side), place options on the left */}
          {isOwnMessage && (
            <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-0.5">
              {message.hasError ? (
                <button
                  onClick={() => useChatStore.getState().retryMessageUpload(message._id)}
                  className="p-1 hover:bg-base-200 rounded-full text-error"
                  title="Retry upload"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <MessageOptions message={message} isOwnMessage={isOwnMessage} />
              )}
            </div>
          )}
          
          {message.text && <p>{message.text}</p>}
          
          {/* For other's messages (left side), place options on the right */}
          {!isOwnMessage && (
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-0.5">
              <MessageOptions message={message} isOwnMessage={isOwnMessage} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === authUser._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} group`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.isEdited && (
                  <span className="text-xs opacity-50 ml-1">(edited)</span>
                )}
              </div>
              
              {renderMessageContent(message, isOwnMessage)}
              
              {/* Show message status indicators */}
              <div className="chat-footer">
                {renderStatusIndicator(message)}
                
                {/* Show reactions if they exist */}
                {hasReactions(message) && (
                  <div className="mt-1">
                    <MessageReactions message={message} showButton={false} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput replyTo={replyTo} />
    </div>
  );
};

export default ChatContainer;
