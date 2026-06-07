import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import * as db from "../db";

export const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const settings = await db.getInstanceSettings(input.instanceId);
        if (!settings) {
          return null;
        }
        return {
          id: settings.id,
          instanceId: settings.instanceId,
          tokens: settings.tokens,
          rotationMinutes: settings.rotationMinutes,
          delaySeconds: settings.delaySeconds,
          mainMessage: settings.mainMessage,
          category: settings.category,
          createdAt: settings.createdAt,
          updatedAt: settings.updatedAt,
        };
      } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }
    }),

  save: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        tokens: z.string(),
        tokenRotation: z.boolean().optional(),
        messageDelay: z.number(),
        mainMessage: z.string(),
        secondaryMessage: z.string().optional(),
        categoryName: z.string(),
        organizations: z.string().optional(),
        queueMode: z.enum(["1x1", "2x2", "3x3", "4x4"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!input.tokens || input.tokens.trim() === "") {
          throw new Error("Tokens são obrigatórios");
        }

        const result = await db.createOrUpdateInstanceSettings(input.instanceId, {
          instanceId: input.instanceId,
          tokens: input.tokens,
          rotationMinutes: input.tokenRotation ? 90 : 0,
          delaySeconds: input.messageDelay,
          mainMessage: input.mainMessage,
          category: input.categoryName,
        });

        if (input.queueMode) {
          await db.setQueueModes(input.instanceId, [input.queueMode]);
        }

        const tokenCount = input.tokens.split(/[\n,]+/).filter(t => t.trim()).length;
        await db.addLog(input.instanceId, "SUCCESS", `[SISTEMA] Configuracoes salvas com sucesso! Tokens: ${tokenCount} | Delay: ${input.messageDelay}s | Categoria: ${input.categoryName}`);

        return {
          success: true,
          settings: result,
        };
      } catch (error: any) {
        console.error("Error saving settings:", error);
        await db.addLog(input.instanceId, "ERROR", `[SISTEMA] Erro ao salvar configuracoes: ${error.message}`);
        throw error;
      }
    }),

  getQueueModes: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const modes = await db.getQueueModes(input.instanceId);
        return modes;
      } catch (error) {
        console.error("Error fetching queue modes:", error);
        throw error;
      }
    }),

  getOrganizations: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const orgs = await db.getOrganizations(input.instanceId);
        return orgs;
      } catch (error) {
        console.error("Error fetching organizations:", error);
        throw error;
      }
    }),
});
