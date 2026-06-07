import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, instances, instanceSettings, queueModes, organizations, statistics, logs, Instance, InsertInstance, InstanceSettings, InsertInstanceSettings, QueueMode, InsertQueueMode, Organization, InsertOrganization, Statistics, InsertStatistics, Log, InsertLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbConnecting = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && !_dbConnecting && process.env.DATABASE_URL) {
    _dbConnecting = true;
    try {
      const client = postgres(process.env.DATABASE_URL, {
        connect_timeout: 10,
        idle_timeout: 30,
        max_lifetime: 60 * 60,
      });
      _db = drizzle(client);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    } finally {
      _dbConnecting = false;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Discord Bot Manager Helpers

export async function createInstance(userId: number, name: string): Promise<Instance | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(instances).values({
    userId,
    name,
    status: 'offline',
    uptime: 0,
  });

  const insertedId = (result as any).insertId;
  const instance = await db.select().from(instances).where(eq(instances.id, insertedId)).limit(1);
  return instance.length > 0 ? instance[0] : null;
}

export async function getUserInstances(userId: number): Promise<Instance[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(instances).where(eq(instances.userId, userId));
}

export async function getInstanceById(id: number): Promise<Instance | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateInstanceStatus(id: number, status: 'online' | 'offline' | 'error'): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(instances).set({ status, updatedAt: new Date() }).where(eq(instances.id, id));
}

export async function updateInstanceUptime(id: number, uptime: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(instances).set({ uptime, updatedAt: new Date() }).where(eq(instances.id, id));
}

export async function createOrUpdateInstanceSettings(instanceId: number, settings: Partial<InsertInstanceSettings>): Promise<InstanceSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(instanceSettings).where(eq(instanceSettings.instanceId, instanceId)).limit(1);

  if (existing.length > 0) {
    await db.update(instanceSettings).set({ ...settings, updatedAt: new Date() }).where(eq(instanceSettings.instanceId, instanceId));
    const updated = await db.select().from(instanceSettings).where(eq(instanceSettings.instanceId, instanceId)).limit(1);
    return updated.length > 0 ? updated[0] : null;
  } else {
    const result = await db.insert(instanceSettings).values({
      instanceId,
      ...settings,
    } as InsertInstanceSettings);
    const insertedId = (result as any).insertId;
    const created = await db.select().from(instanceSettings).where(eq(instanceSettings.id, insertedId)).limit(1);
    return created.length > 0 ? created[0] : null;
  }
}

export async function getInstanceSettings(instanceId: number): Promise<InstanceSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(instanceSettings).where(eq(instanceSettings.instanceId, instanceId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getQueueModes(instanceId: number): Promise<QueueMode[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(queueModes).where(eq(queueModes.instanceId, instanceId));
}

export async function setQueueModes(instanceId: number, modes: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete existing modes
  await db.delete(queueModes).where(eq(queueModes.instanceId, instanceId));

  // Insert new modes
  if (modes.length > 0) {
    await db.insert(queueModes).values(modes.map(mode => ({ instanceId, mode })));
  }
}

export async function getOrganizations(instanceId: number): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(organizations).where(eq(organizations.instanceId, instanceId));
}

export async function updateOrganization(id: number, data: Partial<Organization>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, id));
}

export async function getStatistics(instanceId: number): Promise<Statistics | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(statistics).where(eq(statistics.instanceId, instanceId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateStatistics(instanceId: number, stats: Partial<InsertStatistics>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(statistics).where(eq(statistics.instanceId, instanceId)).limit(1);

  if (existing.length > 0) {
    await db.update(statistics).set({ ...stats, updatedAt: new Date() }).where(eq(statistics.instanceId, instanceId));
  } else {
    await db.insert(statistics).values({
      instanceId,
      ...stats,
    } as InsertStatistics);
  }
}

export async function resetStatistics(instanceId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(statistics).set({
    entries: 0,
    queues: 0,
    matches: 0,
    dms: 0,
    updatedAt: new Date(),
  }).where(eq(statistics.instanceId, instanceId));
}

export async function addLog(instanceId: number, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string): Promise<Log | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(logs).values({
    instanceId,
    level,
    message,
  });

  const insertedId = (result as any).insertId;
  const log = await db.select().from(logs).where(eq(logs.id, insertedId)).limit(1);
  return log.length > 0 ? log[0] : null;
}

export async function getInstanceLogs(instanceId: number, limit: number = 100): Promise<Log[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(logs).where(eq(logs.instanceId, instanceId)).orderBy(logs.createdAt).limit(limit);
}

export async function clearInstanceLogs(instanceId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(logs).where(eq(logs.instanceId, instanceId));
}

export async function getAggregatedStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalEntries: 0, totalQueues: 0, totalMatches: 0, totalDms: 0, onlineBots: 0, totalBots: 0 };

  const userInstances = await db.select().from(instances).where(eq(instances.userId, userId));
  const instanceIds = userInstances.map(i => i.id);

  if (instanceIds.length === 0) {
    return { totalEntries: 0, totalQueues: 0, totalMatches: 0, totalDms: 0, onlineBots: 0, totalBots: 0 };
  }

  let allStats: Statistics[] = [];
  for (const id of instanceIds) {
    const stat = await getStatistics(id);
    if (stat) allStats.push(stat);
  }

  const totalEntries = allStats.reduce((sum, s) => sum + s.entries, 0);
  const totalQueues = allStats.reduce((sum, s) => sum + s.queues, 0);
  const totalMatches = allStats.reduce((sum, s) => sum + s.matches, 0);
  const totalDms = allStats.reduce((sum, s) => sum + s.dms, 0);
  const onlineBots = userInstances.filter(i => i.status === 'online').length;
  const totalBots = userInstances.length;

  return { totalEntries, totalQueues, totalMatches, totalDms, onlineBots, totalBots };
}
