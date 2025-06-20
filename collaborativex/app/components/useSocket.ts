import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const useSocket = (url: string, token: string | null) => {
  const [socket, setSocket] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!token) {
      console.error("No token found, authentication may fail");
      return;
    }
    if (hasInitialized.current) return; // Prevent reinitialization

    const newSocket = io(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      if (!socketRef.current) {
        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    hasInitialized.current = true;

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket:", socketRef.current.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, token]); // Dependencies

  return socket;
};

export default useSocket;
