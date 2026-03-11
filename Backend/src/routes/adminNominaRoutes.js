const express = require("express");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /admin/nomina/supervisors
 * Lista supervisores (para el combo del panel)
 */
router.get("/supervisors", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'SUPERVISOR'
    ORDER BY u.full_name ASC
  `).all();

  res.json({ supervisors: rows });
});

/**
 * GET /admin/nomina/operarios
 * Lista operarios (para asignarlos)
 */
router.get("/operarios", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'OPERARIO'
    ORDER BY u.full_name ASC
  `).all();

  res.json({ operarios: rows });
});

/**
 * GET /admin/nomina/supervisors/:supervisorId/workers
 * Lista operarios asignados a ese supervisor (nómina)
 */
router.get("/supervisors/:supervisorId/workers", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId } = req.params;

  // validar que existe y es supervisor
  const sup = db.prepare(`
    SELECT u.id, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `).get(supervisorId);

  if (!sup) return res.status(404).json({ error: "Supervisor no existe" });
  if (sup.role !== "SUPERVISOR") return res.status(400).json({ error: "El usuario no es SUPERVISOR" });

  const workers = db.prepare(`
    SELECT
      u.id,
      u.full_name,
      u.username,
      u.active,
      so.active AS in_nomina
    FROM supervisor_operarios so
    JOIN users u ON u.id = so.operario_id
    WHERE so.supervisor_id = ?
    ORDER BY u.full_name ASC
  `).all(supervisorId);

  res.json({ supervisorId, workers });
});

/**
 * POST /admin/nomina/supervisors/:supervisorId/workers/:operarioId
 * Asigna (o reactiva) operario a supervisor
 */
router.post("/supervisors/:supervisorId/workers/:operarioId", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, operarioId } = req.params;

  // validar supervisor
  const sup = db.prepare(`
    SELECT u.id, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `).get(supervisorId);

  if (!sup) return res.status(404).json({ error: "Supervisor no existe" });
  if (sup.role !== "SUPERVISOR") return res.status(400).json({ error: "El usuario no es SUPERVISOR" });

  // validar operario
  const op = db.prepare(`
    SELECT u.id, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `).get(operarioId);

  if (!op) return res.status(404).json({ error: "Operario no existe" });
  if (op.role !== "OPERARIO") return res.status(400).json({ error: "El usuario no es OPERARIO" });

  // Insert o Reactivar
  db.prepare(`
    INSERT INTO supervisor_operarios (supervisor_id, operario_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, operario_id)
    DO UPDATE SET active = 1
  `).run(supervisorId, operarioId);

  res.json({ ok: true });
});

/**
 * PATCH /admin/nomina/supervisors/:supervisorId/workers/:operarioId
 * body: { active: true|false }
 * Quita/reactiva operario en nómina de supervisor
 */
router.patch("/supervisors/:supervisorId/workers/:operarioId", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, operarioId } = req.params;
  const { active } = req.body || {};

  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active debe ser boolean" });
  }

  const existing = db.prepare(`
    SELECT supervisor_id, operario_id
    FROM supervisor_operarios
    WHERE supervisor_id = ? AND operario_id = ?
  `).get(supervisorId, operarioId);

  if (!existing) {
    return res.status(404).json({ error: "Relación supervisor-operario no existe" });
  }

  db.prepare(`
    UPDATE supervisor_operarios
    SET active = ?
    WHERE supervisor_id = ? AND operario_id = ?
  `).run(active ? 1 : 0, supervisorId, operarioId);

  res.json({ ok: true });
});

module.exports = { adminNominaRoutes: router };
