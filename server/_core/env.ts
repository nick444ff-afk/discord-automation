export const ENV = {
  appId: process.env.VITE_APP_ID ?? "discord-automation-app",
  cookieSecret: process.env.JWT_SECRET ?? "bot_segredo_123",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:wOFgthbtQZtXujBGzzGsEyMMzsfkLitC@postgres.railway.internal:5432/railway",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://api.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "owner-local",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://api.manus.im",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "local-key",
  ownerName: process.env.OWNER_NAME ?? "Admin",
  port: parseInt(process.env.PORT ?? "8080", 10),
};

// Log de configuração
if (ENV.isProduction) {
  console.log("[Config] Production mode enabled");
} else {
  console.log("[Config] Development mode - using default values for missing env vars");
}
