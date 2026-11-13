const { loadConfig } = require("./config");
const { createApp } = require("./app");

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Configuration error: ${err.message}`);
  process.exit(1);
}

const app = createApp(config);

app.listen(config.port, () => {
  // Never print config or secret values[cite: 1, 2]
  console.log(`DineDesk API listening on port ${config.port}`);
});