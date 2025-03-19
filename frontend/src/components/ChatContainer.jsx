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

    if (message.status === "sent") {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Delivered
        </div>
      );
    } else if (message.status === "seen") {
      return (
        <div className="text-xs text-blue-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          Seen
        </div>
      );
    }
    
    return null;
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
          
          // If message is deleted, show deleted message
          if (message.isDeleted) {
            return (
              <div
                key={message._id}
                className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
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
                </div>
                
                <div className="chat-bubble bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 italic">
                  This message was deleted
                </div>
              </div>
            );
          }
          
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
              
              <div className="chat-bubble flex flex-col relative">
                {/* Show reply if this is a reply message */}
                {message.isReply && message.replyTo && (
                  <ReplyMessage 
                    replyData={message.replyTo} 
                    senderName={message.senderId === message.replyTo.senderId ? "yourself" : selectedUser?.username} 
                  />
                )}
                
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                <div className="flex items-start">
                  {/* For own messages (right side), place options on the left */}
                  {isOwnMessage && (
                    <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-0.5">
                      <MessageOptions message={message} isOwnMessage={isOwnMessage} />
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
