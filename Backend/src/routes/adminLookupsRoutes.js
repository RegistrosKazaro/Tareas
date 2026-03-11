const express = require("express");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /admin/lookups
 * Devuelve listas para combos del panel:
 * - supervisors
 * - operarios
 * - services
 */
router.get("/lookups", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const supervisors = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'SUPERVISOR'
    ORDER BY u.full_name ASC
  `).all();

  const operarios = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'OPERARIO'
    ORDER BY u.full_name ASC
  `).all();

  const services = db.prepare(`
    SELECT id, name, description, active
    FROM services
    ORDER BY name ASC
  `).all();

  res.json({ supervisors, operarios, services });
});

module.exports = { adminLookupsRoutes: router };
