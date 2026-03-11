const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /auth/login
router.post("/login", (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  // Buscar usuario activo
  const user = db
    .prepare(
      `SELECT id, role_id, full_name, username, password_hash, active
       FROM users
       WHERE username = ?
       LIMIT 1`
    )
    .get(username);

  if (!user || user.active !== 1) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Obtener nombre de rol
  const roleRow = db
    .prepare("SELECT name FROM roles WHERE id = ? LIMIT 1")
    .get(user.role_id);

  const roleName = roleRow?.name;
  if (!roleName) {
    return res.status(500).json({ error: "User role not found" });
  }

  // Validar password
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Crear JWT
  const token = jwt.sign(
    {
      sub: user.id,
      role: roleName,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      role: roleName,
    },
  });
});

module.exports = { authRoutes: router };
