const express = require("express");
const { users } = require("../data/store");
const { requireRole } = require("../middleware/authorize");

function createAdminRouter(authenticate) {
  const router = express.Router();

  // GET /api/admin/users — requires admin role; strips passwordHash from output[cite: 1]
  router.get("/users", authenticate, requireRole("admin"), (req, res) => {
    const safeUsers = users.map(({ passwordHash, ...publicFields }) => publicFields);
    return res.status(200).json({ users: safeUsers });
  });

  return router;
}

module.exports = { createAdminRouter };