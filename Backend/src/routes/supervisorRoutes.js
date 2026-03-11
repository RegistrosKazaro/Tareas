const express = require("express");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /supervisor/workers
 * Devuelve operarios que están en mi nómina
 */
router.get("/workers", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
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
  `).all(req.user.id);

  res.json({ workers: rows });
});

/**
 * POST /supervisor/workers/:operarioId
 * Agrega un operario a mi nómina (o lo reactiva si existía)
 */
router.post("/workers/:operarioId", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const operarioId = req.params.operarioId;

  // Validar que el operario exista y sea OPERARIO
  const op = db.prepare(`
    SELECT u.id, r.name as role, u.active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `).get(operarioId);

  if (!op) return res.status(404).json({ error: "Operario no existe" });
  if (op.role !== "OPERARIO") return res.status(400).json({ error: "El usuario no es OPERARIO" });

  // Insertar o reactivar relación
  db.prepare(`
    INSERT INTO supervisor_operarios (supervisor_id, operario_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, operario_id)
    DO UPDATE SET active = 1
  `).run(req.user.id, operarioId);

  res.json({ ok: true });
});

/**
 * PATCH /supervisor/workers/:operarioId
 * body: { active: true|false }
 * Permite quitar o reactivar operario en la nómina sin borrar
 */
router.patch("/workers/:operarioId", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const operarioId = req.params.operarioId;
  const { active } = req.body || {};

  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active debe ser boolean" });
  }

  const existing = db.prepare(`
    SELECT supervisor_id, operario_id
    FROM supervisor_operarios
    WHERE supervisor_id = ? AND operario_id = ?
  `).get(req.user.id, operarioId);

  if (!existing) {
    return res.status(404).json({ error: "Ese operario no está en tu nómina" });
  }

  db.prepare(`
    UPDATE supervisor_operarios
    SET active = ?
    WHERE supervisor_id = ? AND operario_id = ?
  `).run(active ? 1 : 0, req.user.id, operarioId);

  res.json({ ok: true });
});
router.get("/stats", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.user.id;

  const operarioCount = db
    .prepare("SELECT COUNT(*) as cnt FROM supervisor_operarios WHERE supervisor_id = ? AND active = 1")
    .get(supervisorId);

  const taskTotal = db
    .prepare("SELECT COUNT(*) as cnt FROM tasks WHERE supervisor_id = ?")
    .get(supervisorId);

  const taskCompleted = db
    .prepare("SELECT COUNT(*) as cnt FROM tasks WHERE supervisor_id = ? AND status = 'DONE'")
    .get(supervisorId);

  const taskPending = db
    .prepare("SELECT COUNT(*) as cnt FROM tasks WHERE supervisor_id = ? AND status = 'PENDING'")
    .get(supervisorId);

  const recentTasks = db.prepare(`
    SELECT t.id, t.title, t.status, t.due_date, u.full_name as operario_name
    FROM tasks t
    JOIN users u ON u.id = t.operario_id
    WHERE t.supervisor_id = ?
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all(supervisorId);

  res.json({
    operarios: operarioCount.cnt,
    taskTotal: taskTotal.cnt,
    taskDone: taskCompleted.cnt,
    taskPending: taskPending.cnt,
    recentTasks,
  });
});

module.exports = { supervisorRoutes: router };
