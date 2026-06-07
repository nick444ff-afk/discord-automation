import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";
import * as botManager from "../botManager";

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
    .input(z.object({ instanceId: z.number() }).or(z.object({ id: z.number() })))
    .query(async ({ input: rawInput }) => {
      const input = { instanceId: (rawInput as any).instanceId || (rawInput as any).id };
      try {
        const instance = await db.getInstanceById(input.instanceId);
        if (!instance) {
          throw new Error("Instance not found");
        }
        const botStatus = botManager.getBotInstanceStatus(input.instanceId);
        return {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          uptime: botStatus.uptime || instance.uptime,
          isRunning: botStatus.isRunning,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        };
      } catch (error) {
        console.error("Error fetching instance status:", error);
        throw error;
      }
    }),

  start: protectedProcedure
    .input(z.object({ instanceId: z.number() }).or(z.object({ id: z.number() })))
    .mutation(async ({ input: rawInput }) => {
      const input = { instanceId: (rawInput as any).instanceId || (rawInput as any).id };
      try {
        const result = await botManager.startBotInstance(input.instanceId);
        if (result.status === "success") {
          await db.addLog(input.instanceId, "SUCCESS", `[SISTEMA] Bot iniciado com sucesso via painel.`);
          return { success: true, message: result.message };
        } else {
          await db.addLog(input.instanceId, "ERROR", `[SISTEMA] Erro ao iniciar bot: ${result.message}`);
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error("Error starting instance:", error);
        throw error;
      }
    }),

  stop: protectedProcedure
    .input(z.object({ instanceId: z.number() }).or(z.object({ id: z.number() })))
    .mutation(async ({ input: rawInput }) => {
      const input = { instanceId: (rawInput as any).instanceId || (rawInput as any).id };
      try {
        const result = await botManager.stopBotInstance(input.instanceId);
        if (result.status === "success") {
          await db.addLog(input.instanceId, "INFO", `[SISTEMA] Bot parado via painel.`);
          return { success: true, message: result.message };
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
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
