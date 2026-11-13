// Requirement 4.2: Branch Report Scoping
const express = require("express");
const { orders } = require("../data/store");
const { requirePermission } = require("../middleware/authorize");

function createReportsRouter(authenticate) {
  const router = express.Router();

  // GET /api/reports/branch — ignores any ?branchId= query param; uses req.user.branchId[cite: 1]
  router.get("/branch", authenticate, requirePermission("reports:read"), (req, res) => {
    const targetBranch = req.user.branchId;

    if (!targetBranch) {
      return res.status(400).json({ error: "Branch-scoped user required for branch report" });
    }

    const branchOrders = orders.filter((o) => o.branchId === targetBranch);
    const totalRevenueEtb = branchOrders.reduce((sum, o) => sum + o.totalEtb, 0);

    return res.status(200).json({
      branchId: targetBranch,
      orderCount: branchOrders.length,
      totalRevenueEtb,
      orders: branchOrders,
    });
  });

  return router;
}

module.exports = { createReportsRouter };