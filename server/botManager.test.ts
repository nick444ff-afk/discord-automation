import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as botManager from "./botManager";
import * as db from "./db";

// Mock the database module
vi.mock("./db");
vi.mock("./socketIO");

describe("Bot Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await botManager.stopAllBotInstances();
  });

  it("should initialize a bot instance", () => {
    const instance = botManager.initializeBotInstance(1);
    expect(instance).toBeDefined();
    expect(instance.isRunning).toBe(false);
    expect(instance.processId).toBeNull();
  });

  it("should return the same instance on multiple initializations", () => {
    const instance1 = botManager.initializeBotInstance(1);
    const instance2 = botManager.initializeBotInstance(1);
    expect(instance1).toBe(instance2);
  });

  it("should get bot instance status", () => {
    botManager.initializeBotInstance(1);
    const status = botManager.getBotInstanceStatus(1);
    expect(status).toEqual({
      isRunning: false,
      processId: null,
      uptime: 0,
      startTime: null,
    });
  });

  it("should return default status for non-existent instance", () => {
    const status = botManager.getBotInstanceStatus(999);
    expect(status).toEqual({
      isRunning: false,
      processId: null,
      uptime: 0,
      startTime: null,
    });
  });

  it("should handle start bot error when instance not found", async () => {
    vi.mocked(db.getInstanceById).mockResolvedValue(null);
    const result = await botManager.startBotInstance(1);
    expect(result.status).toBe("error");
    expect(result.message).toBe("Instância não encontrada");
  });

  it("should handle stop bot when not running", async () => {
    botManager.initializeBotInstance(1);
    const result = await botManager.stopBotInstance(1);
    expect(result.status).toBe("error");
    expect(result.message).toBe("Bot não está em execução");
  });
});
