import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import * as botHandler from "../discordBotHandler";

export const automationRouter = router({
  // Clicar em botão com delay
  clickButton: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        messageId: z.string(),
        buttonCustomId: z.string(),
        delay: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await botHandler.simulateButtonClick(
          input.instanceId,
          input.messageId,
          input.buttonCustomId,
          input.delay || 0
        );
        return result;
      } catch (error: any) {
        throw new Error(`Erro ao clicar botão: ${error.message}`);
      }
    }),

  // Enviar mensagem em canal
  sendMessage: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        channelId: z.string(),
        message: z.string(),
        delay: z.number().optional(),
        mention: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await botHandler.sendMessageToChannel(
          input.instanceId,
          input.channelId,
          input.message,
          input.delay || 0,
          input.mention
        );
        return result;
      } catch (error: any) {
        throw new Error(`Erro ao enviar mensagem: ${error.message}`);
      }
    }),

  // Enviar mensagem com delay customizado
  sendDelayedMessage: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        channelId: z.string(),
        message: z.string(),
        delaySeconds: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await botHandler.sendDelayedMessage(
          input.instanceId,
          input.channelId,
          input.message,
          input.delaySeconds
        );
        return result;
      } catch (error: any) {
        throw new Error(`Erro ao agendar mensagem: ${error.message}`);
      }
    }),

  // Mencionar usuário em canal
  mentionUser: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        channelId: z.string(),
        userId: z.string(),
        delaySeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await botHandler.mentionUserInChannel(
          input.instanceId,
          input.channelId,
          input.userId,
          input.delaySeconds || 0
        );
        return result;
      } catch (error: any) {
        throw new Error(`Erro ao mencionar usuário: ${error.message}`);
      }
    }),

  // Confirmar fila automaticamente
  autoConfirmQueue: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        channelId: z.string(),
        messageId: z.string(),
        confirmButtonCustomId: z.string(),
        delaySeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await botHandler.autoConfirmQueue(
          input.instanceId,
          input.channelId,
          input.messageId,
          input.confirmButtonCustomId,
          input.delaySeconds || 0
        );
        return result;
      } catch (error: any) {
        throw new Error(`Erro ao confirmar fila: ${error.message}`);
      }
    }),
});
