import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Discord Bot Manager SaaS Tables

/**
 * Bot instances table - represents each independent bot instance (BOT 1, BOT 2, etc.)
 * Each instance has its own configuration, statistics, and logs
 */
export const instances = mysqlTable("instances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // "BOT 1", "BOT 2", etc.
  status: mysqlEnum("status", ["online", "offline", "error"]).default("offline").notNull(),
  uptime: int("uptime").default(0).notNull(), // in seconds
  processId: int("processId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Instance = typeof instances.$inferSelect;
export type InsertInstance = typeof instances.$inferInsert;

/**
 * Instance settings table - stores configuration for each bot instance
 * Includes tokens, delays, messages, and other bot-specific settings
 */
export const instanceSettings = mysqlTable("instanceSettings", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  tokens: text("tokens").notNull(), // JSON array of tokens
  rotationMinutes: int("rotationMinutes").default(60).notNull(),
  delaySeconds: int("delaySeconds").default(12).notNull(),
  mainMessage: text("mainMessage").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // Mobile, Emulador, Misto, Tático, Full soco
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstanceSettings = typeof instanceSettings.$inferSelect;
export type InsertInstanceSettings = typeof instanceSettings.$inferInsert;

/**
 * Queue modes table - stores supported queue modes for each instance (1x1, 2x2, 3x3, 4x4)
 */
export const queueModes = mysqlTable("queueModes", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  mode: varchar("mode", { length: 10 }).notNull(), // 1x1, 2x2, 3x3, 4x4
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueueMode = typeof queueModes.$inferSelect;
export type InsertQueueMode = typeof queueModes.$inferInsert;

/**
 * Organizations table - stores organizations/guilds associated with each bot instance
 * Each organization can have a custom message
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  enabled: int("enabled").default(1).notNull(), // 0 or 1 for boolean
  customMessage: text("customMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Statistics table - stores aggregated statistics for each bot instance
 * Tracks entries, queues, matches, DMs sent, and uptime
 */
export const statistics = mysqlTable("statistics", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  entries: int("entries").default(0).notNull(),
  queues: int("queues").default(0).notNull(),
  matches: int("matches").default(0).notNull(),
  dms: int("dms").default(0).notNull(),
  uptime: int("uptime").default(0).notNull(), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = typeof statistics.$inferInsert;

/**
 * Logs table - stores real-time logs for each bot instance
 * Supports multiple log levels: INFO, SUCCESS, WARNING, ERROR
 */
export const logs = mysqlTable("logs", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  level: mysqlEnum("level", ["INFO", "SUCCESS", "WARNING", "ERROR"]).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
