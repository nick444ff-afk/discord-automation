import { integer, text, timestamp, varchar, pgTable, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ['user', 'admin']);
export const instanceStatusEnum = pgEnum("instance_status", ['online', 'offline', 'error']);
export const logLevelEnum = pgEnum("log_level", ['INFO', 'SUCCESS', 'WARNING', 'ERROR']);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Discord Bot Manager SaaS Tables

/**
 * Bot instances table - represents each independent bot instance (BOT 1, BOT 2, etc.)
 * Each instance has its own configuration, statistics, and logs
 */
export const instances = pgTable("instances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // "BOT 1", "BOT 2", etc.
  status: instanceStatusEnum("status").default("offline").notNull(),
  uptime: integer("uptime").default(0).notNull(), // in seconds
  processId: integer("processId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Instance = typeof instances.$inferSelect;
export type InsertInstance = typeof instances.$inferInsert;

/**
 * Instance settings table - stores configuration for each bot instance
 * Includes tokens, delays, messages, and other bot-specific settings
 */
export const instanceSettings = pgTable("instanceSettings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instanceId: integer("instanceId").notNull(),
  tokens: text("tokens").notNull(), // JSON array of tokens
  rotationMinutes: integer("rotationMinutes").default(60).notNull(),
  delaySeconds: integer("delaySeconds").default(12).notNull(),
  mainMessage: text("mainMessage").notNull(),
  secondaryMessage: text("secondaryMessage"),
  category: varchar("category", { length: 50 }).notNull(), // Mobile, Emulador, Misto, Tático, Full soco
  selectedOrgs: text("selectedOrgs"), // Armazenado como JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InstanceSettings = typeof instanceSettings.$inferSelect;
export type InsertInstanceSettings = typeof instanceSettings.$inferInsert;

/**
 * Queue modes table - stores supported queue modes for each instance (1x1, 2x2, 3x3, 4x4)
 */
export const queueModes = pgTable("queueModes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instanceId: integer("instanceId").notNull(),
  mode: varchar("mode", { length: 10 }).notNull(), // 1x1, 2x2, 3x3, 4x4
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueueMode = typeof queueModes.$inferSelect;
export type InsertQueueMode = typeof queueModes.$inferInsert;

/**
 * Organizations table - stores organizations/guilds associated with each bot instance
 * Each organization can have a custom message
 */
export const organizations = pgTable("organizations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instanceId: integer("instanceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  enabled: integer("enabled").default(1).notNull(), // 0 or 1 for boolean
  customMessage: text("customMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Statistics table - stores aggregated statistics for each bot instance
 * Tracks entries, queues, matches, DMs sent, and uptime
 */
export const statistics = pgTable("statistics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instanceId: integer("instanceId").notNull(),
  entries: integer("entries").default(0).notNull(),
  queues: integer("queues").default(0).notNull(),
  matches: integer("matches").default(0).notNull(),
  dms: integer("dms").default(0).notNull(),
  uptime: integer("uptime").default(0).notNull(), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = typeof statistics.$inferInsert;

/**
 * Logs table - stores real-time logs for each bot instance
 * Supports multiple log levels: INFO, SUCCESS, WARNING, ERROR
 */
export const logs = pgTable("logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instanceId: integer("instanceId").notNull(),
  level: logLevelEnum("level").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
