const express = require("express");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

function normalizeRole(role) {
  const r = String(role || "").trim().toUpperCase();
  if (r === "SUPERVISOR" || r === "OPERARIO" || r === "ADMIN") return r;
  return null;
}

router.get("/nomina/supervisores", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'SUPERVISOR'
    ORDER BY u.full_name ASC
  `).all();

  res.json({ supervisores: rows });
});

router.get("/nomina/operarios", auth, requireRole(["ADMIN"]), (req, res) => {
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

router.get("/nomina/:supervisorId", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.supervisorId;

  const sup = db.prepare(`
    SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ? AND r.name = 'SUPERVISOR'
    LIMIT 1
  `).get(supervisorId);

  if (!sup) return res.status(404).json({ error: "Supervisor no encontrado" });

  const rows = db.prepare(`
    SELECT o.id, o.full_name, o.username, o.active, so.active AS link_active
    FROM supervisor_operarios so
    JOIN users o ON o.id = so.operario_id
    WHERE so.supervisor_id = ?
    ORDER BY o.full_name ASC
  `).all(supervisorId);

  res.json({ operarios: rows });
});

router.post("/nomina/assign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, operarioId } = req.body || {};

  if (!supervisorId || !operarioId) {
    return res.status(400).json({ error: "supervisorId y operarioId son requeridos" });
  }

  const sup = db.prepare(`
    SELECT u.id
    FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.id = ? AND r.name = 'SUPERVISOR'
  `).get(supervisorId);
  if (!sup) return res.status(400).json({ error: "supervisorId inválido" });

  const op = db.prepare(`
    SELECT u.id
    FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.id = ? AND r.name = 'OPERARIO'
  `).get(operarioId);
  if (!op) return res.status(400).json({ error: "operarioId inválido" });

  // upsert
  db.prepare(`
    INSERT INTO supervisor_operarios (supervisor_id, operario_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, operario_id)
    DO UPDATE SET active = 1
  `).run(supervisorId, operarioId);

  res.json({ ok: true });
});


router.post("/nomina/unassign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, operarioId } = req.body || {};

  if (!supervisorId || !operarioId) {
    return res.status(400).json({ error: "supervisorId y operarioId son requeridos" });
  }

  db.prepare(`
    UPDATE supervisor_operarios
    SET active = 0
    WHERE supervisor_id = ? AND operario_id = ?
  `).run(supervisorId, operarioId);

  res.json({ ok: true });
});

module.exports = { nominaRoutes: router };
