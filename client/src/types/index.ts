export interface Instance {
  id: number;
  userId: number;
  name: string;
  status: "online" | "offline" | "error";
  uptime: number;
  processId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstanceSettings {
  id: number;
  instanceId: number;
  tokens: string; // JSON array
  rotationMinutes: number;
  delaySeconds: number;
  mainMessage: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueMode {
  id: number;
  instanceId: number;
  mode: string; // "1x1", "2x2", "3x3", "4x4"
  createdAt: Date;
}

export interface Organization {
  id: number;
  instanceId: number;
  name: string;
  enabled: number;
  customMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Statistics {
  id: number;
  instanceId: number;
  entries: number;
  queues: number;
  matches: number;
  dms: number;
  uptime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Log {
  id: number;
  instanceId: number;
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
  createdAt: Date;
}

export interface AggregatedStats {
  totalEntries: number;
  totalQueues: number;
  totalMatches: number;
  totalDms: number;
  onlineBots: number;
  totalBots: number;
}
