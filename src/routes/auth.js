const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail, DUMMY_PASSWORD_HASH } = require("../data/store");

function createAuthRouter(config) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    // Extract only email and password — ignore any role or branchId supplied by client[cite: 1]
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = findUserByEmail(email);
    const hashToCompare = user ? user.passwordHash : DUMMY_PASSWORD_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Minimal claims only: sub, plus standard iss, aud, exp <= 15m[cite: 1, 2]
    const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    return res.status(200).json({ token });
  });

  return router;
}

module.exports = { createAuthRouter };