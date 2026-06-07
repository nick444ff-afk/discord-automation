import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Custom hook for Socket.IO connection and event handling
 * @param instanceId - The bot instance ID to subscribe to
 * @returns Socket instance and connection state
 */
export function useSocketIO(instanceId?: number) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected:", socket.id);

      // Subscribe to logs for the current instance
      if (instanceId) {
        socket.emit("subscribe:logs", instanceId);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] Disconnected");
    });

    socket.on("error", (error) => {
      console.error("[Socket.IO] Error:", error);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [instanceId]);

  const subscribe = useCallback((id: number) => {
    if (socketRef.current) {
      socketRef.current.emit("subscribe:logs", id);
    }
  }, []);

  const unsubscribe = useCallback((id: number) => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribe:logs", id);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    on,
    off,
    isConnected: socketRef.current?.connected ?? false,
  };
}
