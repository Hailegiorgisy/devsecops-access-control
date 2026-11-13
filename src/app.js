const express = require("express");
const { createAuthenticate } = require("./middleware/authenticate");
const { createAuthRouter } = require("./routes/auth");
const { createOrdersRouter } = require("./routes/orders");
const { createPaymentsRouter } = require("./routes/payments");
const { createReportsRouter } = require("./routes/reports");
const { createAdminRouter } = require("./routes/admin");

function createApp(config) {
  const app = express();
  app.use(express.json());

  const authenticate = createAuthenticate(config);

  app.use("/api/auth", createAuthRouter(config));
  app.use("/api/orders", createOrdersRouter(authenticate));
  app.use("/api/payments", createPaymentsRouter(authenticate));
  app.use("/api/reports", createReportsRouter(authenticate));
  app.use("/api/admin", createAdminRouter(authenticate));

  return app;
}

module.exports = { createApp };