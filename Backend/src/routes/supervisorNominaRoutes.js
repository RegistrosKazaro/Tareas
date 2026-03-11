const express = require("express");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /supervisor/nomina
 * Devuelve operarios asignados a ESTE supervisor (solo activos en la relación)
 */
router.get("/nomina", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
    SELECT
      o.id, o.full_name, o.username, o.active,
      so.active AS link_active
    FROM supervisor_operarios so
    JOIN users o ON o.id = so.operario_id
    JOIN users s ON s.id = so.supervisor_id
    WHERE so.supervisor_id = ?
      AND so.active = 1
    ORDER BY o.full_name ASC
  `).all(req.user.id);

  res.json({ operarios: rows });
});

module.exports = { supervisorNominaRoutes: router };