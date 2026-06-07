import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Usuário padrão para acesso sem autenticação
const DEFAULT_USER = {
  id: 1,
  openId: "default-user",
  name: "Admin",
  email: "admin@discord-bot.local",
  loginMethod: "local",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(() => DEFAULT_USER),
    
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  instances: router({
    list: publicProcedure.query(() => db.getUserInstances(DEFAULT_USER.id)),
    
    create: publicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(({ input }) => db.createInstance(DEFAULT_USER.id, input.name)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getInstanceById(input.id)),
    
    updateStatus: publicProcedure
      .input(z.object({ id: z.number(), status: z.enum(["online", "offline", "error"]) }))
      .mutation(({ input }) => db.updateInstanceStatus(input.id, input.status)),
    
    updateUptime: publicProcedure
      .input(z.object({ id: z.number(), uptime: z.number() }))
      .mutation(({ input }) => db.updateInstanceUptime(input.id, input.uptime)),
  }),

  settings: router({
    get: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getInstanceSettings(input.instanceId)),
    
    save: publicProcedure
      .input(z.object({
        instanceId: z.number(),
        tokens: z.string(),
        tokenRotation: z.boolean(),
        messageDelay: z.number(),
        mainMessage: z.string(),
        secondaryMessage: z.string(),
        categoryName: z.string(),
        organizations: z.string(),
        queueMode: z.enum(["1x1", "2x2", "3x3", "4x4"]),
      }))
      .mutation(({ input }) => db.createOrUpdateInstanceSettings(input.instanceId, input)),
  }),

  queueModes: router({
    list: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getQueueModes(input.instanceId)),
  }),

  organizations: router({
    list: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getOrganizations(input.instanceId)),
  }),

  statistics: router({
    get: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getStatistics(input.instanceId)),
    
    update: publicProcedure
      .input(z.object({
        instanceId: z.number(),
        entries: z.number().optional(),
        activeQueues: z.number().optional(),
        matchesFound: z.number().optional(),
        dmsSent: z.number().optional(),
        uptime: z.number().optional(),
      }))
      .mutation(({ input }) => db.updateStatistics(input.instanceId, input)),
  }),

  logs: router({
    list: publicProcedure
      .input(z.object({ instanceId: z.number(), limit: z.number().default(100) }))
      .query(({ input }) => db.getInstanceLogs(input.instanceId, input.limit)),
    
    add: publicProcedure
      .input(z.object({
        instanceId: z.number(),
        level: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
        message: z.string(),
      }))
      .mutation(({ input }) => db.addLog(input.instanceId, input.level, input.message)),
    
    clear: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(({ input }) => db.clearInstanceLogs(input.instanceId)),
  }),
});

export type AppRouter = typeof appRouter;
