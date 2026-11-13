const request = require("supertest");
const jwt = require("jsonwebtoken");
const { loadConfig } = require("../src/config");
const { createApp } = require("../src/app");

// Ephemeral non-production test secret (>= 32 chars)[cite: 1]
const TEST_SECRET = process.env.JWT_SECRET || "test-only-signing-key-minimum-32-characters-long";

const config = loadConfig({
  JWT_SECRET: TEST_SECRET,
  JWT_ISSUER: "dinedesk-api",
  JWT_AUDIENCE: "dinedesk-clients",
});

const app = createApp(config);

async function loginAs(email, password) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return res.body.token;
}

describe("DineDesk API — Authentication, RBAC & Branch Isolation", () => {
  let boleWaiterToken;
  let boleCashierToken;
  let boleManagerToken;
  let piassaManagerToken;
  let adminToken;

  beforeAll(async () => {
    boleWaiterToken = await loginAs("bole.waiter@dinedesk.et", "WaiterBole#2026");
    boleCashierToken = await loginAs("bole.cashier@dinedesk.et", "CashierBole#2026");
    boleManagerToken = await loginAs("bole.manager@dinedesk.et", "ManagerBole#2026");
    piassaManagerToken = await loginAs("piassa.manager@dinedesk.et", "ManagerPiassa#2026");
    adminToken = await loginAs("admin@dinedesk.et", "AdminChain#2026");
  });

  // 1. No token -> 401
  test("no token -> 401", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  // 2. Malformed token -> 401
  test("malformed Authorization header -> 401", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Token ${boleWaiterToken}`);
    expect(res.status).toBe(401);
  });

  // 3. Token signed with wrong key -> 401
  test("token signed with the wrong key -> 401", async () => {
    const forgedToken = jwt.sign(
      { sub: "u-admin" },
      "wrong-secret-key-that-is-also-at-least-32-chars",
      {
        algorithm: "HS256",
        expiresIn: "15m",
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      }
    );

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
  });

  // 4. Expired token -> 401
  test("expired token -> 401", async () => {
    const expiredToken = jwt.sign(
      { sub: "u-bole-manager" },
      config.jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "-10s",
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      }
    );

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  // 5. Waiter calling GET /api/admin/users -> 403
  test("waiter calling GET /api/admin/users -> 403", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${boleWaiterToken}`);
    expect(res.status).toBe(403);
  });

  // 6. Administrator calling GET /api/admin/users -> 200 with no password hashes
  test("administrator calling GET /api/admin/users -> 200 with no password hashes", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(7);
    for (const user of res.body.users) {
      expect(user.passwordHash).toBeUndefined();
    }
  });

  // 7. Waiter creating an order -> 201
  test("waiter creating an order -> 201", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${boleWaiterToken}`)
      .send({
        tableNumber: 12,
        items: ["Firfir", "Tea"],
        totalEtb: 350,
        branchId: "piassa", // Client branch override attempt must be ignored
      });

    expect(res.status).toBe(201);
    expect(res.body.order.branchId).toBe("bole");
  });

  // 8. Cashier creating an order -> 403
  test("cashier creating an order -> 403", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${boleCashierToken}`)
      .send({
        tableNumber: 3,
        items: ["Pasta"],
        totalEtb: 400,
      });

    expect(res.status).toBe(403);
  });

  // 9. Bole manager reading a Bole order -> 200
  test("Bole manager reading a Bole order -> 200", async () => {
    const res = await request(app)
      .get("/api/orders/ord-101")
      .set("Authorization", `Bearer ${boleManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe("ord-101");
    expect(res.body.order.branchId).toBe("bole");
  });

  // 10. Bole manager reading a Piassa order -> 404 (denied)
  test("Bole manager reading a Piassa order -> 404 (denied)", async () => {
    const res = await request(app)
      .get("/api/orders/ord-201")
      .set("Authorization", `Bearer ${boleManagerToken}`);

    expect(res.status).toBe(404);
  });

  // 11. Waiter calling GET /api/reports/branch -> 403
  test("waiter calling GET /api/reports/branch -> 403", async () => {
    const res = await request(app)
      .get("/api/reports/branch")
      .set("Authorization", `Bearer ${boleWaiterToken}`);

    expect(res.status).toBe(403);
  });

  // 12. Piassa manager calling /api/reports/branch?branchId=bole -> still only Piassa data
  test("Piassa manager calling /api/reports/branch?branchId=bole -> still only Piassa data", async () => {
    const res = await request(app)
      .get("/api/reports/branch?branchId=bole")
      .set("Authorization", `Bearer ${piassaManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.branchId).toBe("piassa");
    expect(res.body.orders.every((o) => o.branchId === "piassa")).toBe(true);
  });

  // 13. Branch-scoped order listing
  test("Bole waiter listing GET /api/orders only receives Bole orders", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${boleWaiterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThan(0);
    expect(res.body.orders.every((o) => o.branchId === "bole")).toBe(true);
  });

  // 14. Config startup validation
  test("config validation fails safely when JWT_SECRET is missing or too short", () => {
    expect(() => loadConfig({})).toThrow("Missing required environment variable: JWT_SECRET");

    const shortSecret = "too-short-secret";
    expect(() => loadConfig({ JWT_SECRET: shortSecret })).toThrow(
      "JWT_SECRET must be at least 32 characters long"
    );
  });
});