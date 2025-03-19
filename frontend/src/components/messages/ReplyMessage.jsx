import { useAuthStore } from "../../store/useAuthStore";

const ReplyMessage = ({ replyData, senderName }) => {
  const { authUser } = useAuthStore();
  const isOwnReply = replyData.senderId === authUser._id;

  return (
    <div className="flex flex-col mb-1 mt-1">
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <div className="mr-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        </div>
        <span>Replying to {isOwnReply ? "yourself" : senderName}</span>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm text-gray-700 dark:text-gray-300 max-w-[90%]">
        {replyData.text}
      </div>
    </div>
  );
};

export default ReplyMessage; 