const bcrypt = require("bcryptjs");

// Pre-hashed passwords using bcrypt (10 rounds) — never plaintext[cite: 1]
// Test passwords:
//   bole.waiter@dinedesk.et    -> WaiterBole#2026
//   piassa.waiter@dinedesk.et  -> WaiterPiassa#2026
//   bole.cashier@dinedesk.et   -> CashierBole#2026
//   piassa.cashier@dinedesk.et -> CashierPiassa#2026
//   bole.manager@dinedesk.et   -> ManagerBole#2026
//   piassa.manager@dinedesk.et -> ManagerPiassa#2026
//   admin@dinedesk.et          -> AdminChain#2026

const users = [
  {
    id: "u-bole-waiter",
    name: "Dawit Bekele",
    email: "bole.waiter@dinedesk.et",
    role: "waiter",
    branchId: "bole",
    passwordHash: bcrypt.hashSync("WaiterBole#2026", 10),
  },
  {
    id: "u-piassa-waiter",
    name: "Selamawit Tadesse",
    email: "piassa.waiter@dinedesk.et",
    role: "waiter",
    branchId: "piassa",
    passwordHash: bcrypt.hashSync("WaiterPiassa#2026", 10),
  },
  {
    id: "u-bole-cashier",
    name: "Robel Girma",
    email: "bole.cashier@dinedesk.et",
    role: "cashier",
    branchId: "bole",
    passwordHash: bcrypt.hashSync("CashierBole#2026", 10),
  },
  {
    id: "u-piassa-cashier",
    name: "Hanna Alemu",
    email: "piassa.cashier@dinedesk.et",
    role: "cashier",
    branchId: "piassa",
    passwordHash: bcrypt.hashSync("CashierPiassa#2026", 10),
  },
  {
    id: "u-bole-manager",
    name: "Yohannes Kebede",
    email: "bole.manager@dinedesk.et",
    role: "manager",
    branchId: "bole",
    passwordHash: bcrypt.hashSync("ManagerBole#2026", 10),
  },
  {
    id: "u-piassa-manager",
    name: "Meron Desta",
    email: "piassa.manager@dinedesk.et",
    role: "manager",
    branchId: "piassa",
    passwordHash: bcrypt.hashSync("ManagerPiassa#2026", 10),
  },
  {
    id: "u-admin",
    name: "Abebe Bikila",
    email: "admin@dinedesk.et",
    role: "admin",
    branchId: null, // Administrator belongs to no branch[cite: 1]
    passwordHash: bcrypt.hashSync("AdminChain#2026", 10),
  },
];

// Dummy hash for constant-time comparison when email does not exist[cite: 2]
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("DummyTimingDefense#2026", 10);

const orders = [
  {
    id: "ord-101",
    branchId: "bole",
    tableNumber: 4,
    items: ["Doro Wat", "Injera"],
    totalEtb: 850,
    status: "open",
    createdBy: "u-bole-waiter",
  },
  {
    id: "ord-102",
    branchId: "bole",
    tableNumber: 7,
    items: ["Kitfo", "Ayib"],
    totalEtb: 1100,
    status: "paid",
    createdBy: "u-bole-waiter",
  },
  {
    id: "ord-201",
    branchId: "piassa",
    tableNumber: 2,
    items: ["Tibs", "Macchiato"],
    totalEtb: 720,
    status: "open",
    createdBy: "u-piassa-waiter",
  },
  {
    id: "ord-202",
    branchId: "piassa",
    tableNumber: 9,
    items: ["Shiro", "Tej"],
    totalEtb: 490,
    status: "paid",
    createdBy: "u-piassa-waiter",
  },
];

const payments = [];

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase()) || null;
}

function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

module.exports = {
  users,
  orders,
  payments,
  DUMMY_PASSWORD_HASH,
  findUserByEmail,
  findUserById,
};
