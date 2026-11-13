// Startup Configuration Validation
require("dotenv").config();

function loadConfig(env = process.env) {
  const required = ["JWT_SECRET"];
  const missing = required.filter((key) => !env[key] || env[key].trim() === "");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable: ${missing.join(", ")}`);
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return Object.freeze({
    port: Number(env.PORT) || 3000,
    jwtSecret: env.JWT_SECRET,
    jwtIssuer: env.JWT_ISSUER || "dinedesk-api",
    jwtAudience: env.JWT_AUDIENCE || "dinedesk-clients",
    jwtExpiresIn: "15m",
  });
}

module.exports = { loadConfig };