const jwt = require("jsonwebtoken");
const { findUserById } = require("../data/store");

function createAuthenticate(config) {
  return function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");

    // Accept strictly "Authorization: Bearer <token>"[cite: 1]
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = parts[1];
    let payload;

    try {
      payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"], // Explicit allowlist prevents alg:none & confusion[cite: 1, 2]
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      });
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Load authoritative user state from server records — never trust headers/body/query[cite: 1, 2]
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    return next();
  };
}

module.exports = { createAuthenticate };