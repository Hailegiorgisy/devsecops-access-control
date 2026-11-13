const express = require("express");
const { orders, payments } = require("../data/store");
const { requirePermission } = require("../middleware/authorize");
const { canAccessOrder } = require("../policies");

function createPaymentsRouter(authenticate) {
  const router = express.Router();

  router.post("/", authenticate, requirePermission("payments:create"), (req, res) => {
    const { orderId, method } = req.body || {};
    const order = orders.find((o) => o.id === orderId);

    if (!order || !canAccessOrder(req.user, order)) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = "paid";
    const payment = {
      id: `pay-${Date.now()}`,
      orderId: order.id,
      branchId: order.branchId,
      amountEtb: order.totalEtb,
      method: method || "card",
      processedBy: req.user.id,
    };
    payments.push(payment);

    return res.status(201).json({ payment });
  });

  return router;
}

module.exports = { createPaymentsRouter };