import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  instances: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserInstances(ctx.user.id)),
    
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(({ ctx, input }) => db.createInstance(ctx.user.id, input.name)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getInstanceById(input.id)),
    
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["online", "offline", "error"]) }))
      .mutation(({ input }) => db.updateInstanceStatus(input.id, input.status)),
    
    updateUptime: protectedProcedure
      .input(z.object({ id: z.number(), uptime: z.number() }))
      .mutation(({ input }) => db.updateInstanceUptime(input.id, input.uptime)),
  }),

  settings: router({
    get: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getInstanceSettings(input.instanceId)),
    
    save: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        tokens: z.string(),
        rotationMinutes: z.number(),
        delaySeconds: z.number(),
        mainMessage: z.string(),
        category: z.string(),
      }))
      .mutation(({ input }) => db.createOrUpdateInstanceSettings(input.instanceId, {
        tokens: input.tokens,
        rotationMinutes: input.rotationMinutes,
        delaySeconds: input.delaySeconds,
        mainMessage: input.mainMessage,
        category: input.category,
      })),
  }),

  queueModes: router({
    get: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getQueueModes(input.instanceId)),
    
    set: protectedProcedure
      .input(z.object({ instanceId: z.number(), modes: z.array(z.string()) }))
      .mutation(({ input }) => db.setQueueModes(input.instanceId, input.modes)),
  }),

  organizations: router({
    list: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getOrganizations(input.instanceId)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        enabled: z.number().optional(),
        customMessage: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateOrganization(input.id, {
        enabled: input.enabled,
        customMessage: input.customMessage,
      })),
  }),

  statistics: router({
    get: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(({ input }) => db.getStatistics(input.instanceId)),
    
    update: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        entries: z.number().optional(),
        queues: z.number().optional(),
        matches: z.number().optional(),
        dms: z.number().optional(),
        uptime: z.number().optional(),
      }))
      .mutation(({ input }) => db.updateStatistics(input.instanceId, {
        entries: input.entries,
        queues: input.queues,
        matches: input.matches,
        dms: input.dms,
        uptime: input.uptime,
      })),
    
    reset: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(({ input }) => db.resetStatistics(input.instanceId)),
    
    aggregated: protectedProcedure.query(({ ctx }) => db.getAggregatedStats(ctx.user.id)),
  }),

  logs: router({
    list: protectedProcedure
      .input(z.object({ instanceId: z.number(), limit: z.number().default(100) }))
      .query(({ input }) => db.getInstanceLogs(input.instanceId, input.limit)),
    
    add: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        level: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
        message: z.string(),
      }))
      .mutation(({ input }) => db.addLog(input.instanceId, input.level, input.message)),
    
    clear: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(({ input }) => db.clearInstanceLogs(input.instanceId)),
  }),
});

export type AppRouter = typeof appRouter;
