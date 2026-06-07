import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";

export const instancesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const instances = await db.getUserInstances(ctx.user.id);
      return instances;
    } catch (error) {
      console.error("Error fetching instances:", error);
      return [];
    }
  }),

  getStatus: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const instance = await db.getInstanceById(input.instanceId);
        if (!instance) {
          throw new Error("Instance not found");
        }
        return {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          uptime: instance.uptime,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        };
      } catch (error) {
        console.error("Error fetching instance status:", error);
        throw error;
      }
    }),

  start: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // This would call the bot manager in a real scenario
        await db.updateInstanceStatus(input.instanceId, "online");
        return { success: true, message: "Instance started" };
      } catch (error) {
        console.error("Error starting instance:", error);
        throw error;
      }
    }),

  stop: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // This would call the bot manager in a real scenario
        await db.updateInstanceStatus(input.instanceId, "offline");
        return { success: true, message: "Instance stopped" };
      } catch (error) {
        console.error("Error stopping instance:", error);
        throw error;
      }
    }),

  updateStatus: protectedProcedure
    .input(z.object({ instanceId: z.number(), status: z.enum(["online", "offline", "error"]) }))
    .mutation(async ({ input }) => {
      try {
        await db.updateInstanceStatus(input.instanceId, input.status);
        return { success: true };
      } catch (error) {
        console.error("Error updating instance status:", error);
        throw error;
      }
    }),
});
