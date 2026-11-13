const express = require("express");
const { orders } = require("../data/store");
const { requirePermission } = require("../middleware/authorize");
const { canAccessOrder } = require("../policies");

function createOrdersRouter(authenticate) {
  const router = express.Router();

  // GET /api/orders — any authenticated staff, scoped by branch policy[cite: 1]
  router.get("/", authenticate, (req, res) => {
    const visibleOrders = orders.filter((order) => canAccessOrder(req.user, order));
    return res.status(200).json({ orders: visibleOrders });
  });

  // GET /api/orders/:id — requires orders:read + branch policy (404 if not found or cross-branch)[cite: 1, 2]
  router.get("/:id", authenticate, requirePermission("orders:read"), (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);

    if (!order || !canAccessOrder(req.user, order)) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ order });
  });

  // POST /api/orders — requires orders:create; branchId derived strictly from req.user[cite: 1]
  router.post("/", authenticate, requirePermission("orders:create"), (req, res) => {
    const { tableNumber, items, totalEtb } = req.body || {};

    if (!tableNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "tableNumber and non-empty items array are required" });
    }

    if (!req.user.branchId) {
      return res.status(403).json({ error: "User is not assigned to a branch" });
    }

    const newOrder = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      branchId: req.user.branchId,
      tableNumber: Number(tableNumber),
      items: items.map(String),
      totalEtb: Number(totalEtb) || 0,
      status: "open",
      createdBy: req.user.id,
    };

    orders.push(newOrder);
    return res.status(201).json({ order: newOrder });
  });

  return router;
}

module.exports = { createOrdersRouter };