import { Server as SocketIOServer } from "socket.io";

/**
 * Emit a new log message to all connected clients subscribed to a specific instance
 * @param instanceId - The bot instance ID
 * @param level - Log level (INFO, SUCCESS, WARNING, ERROR)
 * @param message - Log message
 */
export function emitLog(instanceId: number, level: string, message: string) {
  const io = (global as any).socketIO as SocketIOServer | undefined;
  if (!io) {
    console.warn("[Socket.IO] Server not initialized, cannot emit log");
    return;
  }

  const room = `logs:${instanceId}`;
  io.to(room).emit("log", {
    instanceId,
    level,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a statistics update to all connected clients subscribed to a specific instance
 * @param instanceId - The bot instance ID
 * @param stats - Statistics object
 */
export function emitStats(instanceId: number, stats: any) {
  const io = (global as any).socketIO as SocketIOServer | undefined;
  if (!io) {
    console.warn("[Socket.IO] Server not initialized, cannot emit stats");
    return;
  }

  const room = `stats:${instanceId}`;
  io.to(room).emit("stats:update", {
    instanceId,
    ...stats,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit an instance status change to all connected clients
 * @param instanceId - The bot instance ID
 * @param status - New status (online, offline, error)
 */
export function emitInstanceStatus(instanceId: number, status: string) {
  const io = (global as any).socketIO as SocketIOServer | undefined;
  if (!io) {
    console.warn("[Socket.IO] Server not initialized, cannot emit status");
    return;
  }

  io.emit("instance:status", {
    instanceId,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast a message to all connected clients
 * @param event - Event name
 * @param data - Event data
 */
export function broadcast(event: string, data: any) {
  const io = (global as any).socketIO as SocketIOServer | undefined;
  if (!io) {
    console.warn("[Socket.IO] Server not initialized, cannot broadcast");
    return;
  }

  io.emit(event, data);
}
