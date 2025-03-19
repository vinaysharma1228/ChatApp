import { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const SocketContext = createContext(null);

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const { socket, authUser, onlineUsers } = useAuthStore();
  const setSocket = useChatStore((state) => state.setSocket);

  useEffect(() => {
    if (authUser && !socket) {
      useAuthStore.getState().connectSocket();
    }
    
    // Update socket in chat store if it exists
    if (socket) {
      setSocket(socket);
    }
    
    return () => {
      if (socket) {
        useAuthStore.getState().disconnectSocket();
      }
    };
  }, [authUser, socket, setSocket]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 