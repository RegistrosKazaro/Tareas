const express = require("express");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

function isISODate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/**
 * GET /admin/tasks
 * Query params opcionales:
 * - from=YYYY-MM-DD
 * - to=YYYY-MM-DD
 * - supervisorId=...
 * - operarioId=...
 * - status=PENDING|DONE
 *
 * Devuelve todas las tareas (monitor admin)
 */
router.get("/tasks", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const { from, to, supervisorId, operarioId, status } = req.query;

  const filters = [];
  const params = [];

  if (from) {
    if (!isISODate(from)) return res.status(400).json({ error: "from inválido (YYYY-MM-DD)" });
    filters.push("t.due_date >= ?");
    params.push(from);
  }

  if (to) {
    if (!isISODate(to)) return res.status(400).json({ error: "to inválido (YYYY-MM-DD)" });
    filters.push("t.due_date <= ?");
    params.push(to);
  }

  if (supervisorId) {
    filters.push("t.supervisor_id = ?");
    params.push(supervisorId);
  }

  if (operarioId) {
    filters.push("t.operario_id = ?");
    params.push(operarioId);
  }

  if (status) {
    const s = String(status).toUpperCase();
    if (s !== "PENDING" && s !== "DONE") return res.status(400).json({ error: "status inválido" });
    filters.push("t.status = ?");
    params.push(s);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = db.prepare(`
    SELECT
      t.id,
      t.title,
      t.description,
      t.due_date,
      t.status,
      t.done_at,
      t.created_at,
      t.updated_at,

      t.supervisor_id,
      sup.full_name AS supervisor_name,
      sup.username AS supervisor_username,

      t.operario_id,
      op.full_name AS operario_name,
      op.username AS operario_username,

      t.service_id,
      s.name AS service_name
    FROM tasks t
    JOIN users sup ON sup.id = t.supervisor_id
    JOIN users op ON op.id = t.operario_id
    LEFT JOIN services s ON s.id = t.service_id
    ${where}
    ORDER BY t.due_date DESC, t.created_at DESC
  `).all(...params);

  res.json({ tasks: rows });
});

module.exports = { adminTasksRoutes: router };
