const express = require("express");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /worker/tasks?status=PENDING|DONE
 * Devuelve tareas del operario logueado
 */
router.get("/tasks", auth, requireRole(["OPERARIO"]), (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.query;

  const filters = ["t.operario_id = ?"];
  const params = [req.user.id];

  if (status) {
    const s = String(status).toUpperCase();
    if (s !== "PENDING" && s !== "DONE") return res.status(400).json({ error: "status inválido" });
    filters.push("t.status = ?");
    params.push(s);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const rows = db.prepare(`
    SELECT
      t.id, t.title, t.description, t.due_date, t.status, t.done_at, t.created_at, t.updated_at,
      t.supervisor_id, sup.full_name AS supervisor_name, sup.username AS supervisor_username,
      t.service_id, s.name AS service_name
    FROM tasks t
    JOIN users sup ON sup.id = t.supervisor_id
    LEFT JOIN services s ON s.id = t.service_id
    ${where}
    ORDER BY t.due_date DESC, t.created_at DESC
  `).all(...params);

  res.json({ tasks: rows });
});

/**
 * PATCH /worker/tasks/:id/done
 * Marca tarea como DONE (solo si pertenece al operario)
 */
router.patch("/tasks/:id/done", auth, requireRole(["OPERARIO"]), (req, res) => {
  const db = req.app.locals.db;
  const taskId = req.params.id;

  const t = db.prepare(`
    SELECT id, operario_id, status
    FROM tasks
    WHERE id = ?
  `).get(taskId);

  if (!t) return res.status(404).json({ error: "Tarea no existe" });
  if (t.operario_id !== req.user.id) return res.status(403).json({ error: "No autorizado" });

  if (t.status === "DONE") return res.json({ ok: true });

  db.prepare(`
    UPDATE tasks
    SET status = 'DONE', done_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(taskId);

  res.json({ ok: true });
});
router.get("/stats", auth, requireRole(["OPERARIO"]), (req, res) => {
  const db = req.app.locals.db;
  const operarioId = req.user.id;

  const taskTotal = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE operario_id = ?").get(operarioId);
  const taskCompleted = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE operario_id = ? AND status = 'DONE'").get(operarioId);
  const taskPending = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE operario_id = ? AND status = 'PENDING'").get(operarioId);

  const recentTasks = db.prepare(`
    SELECT t.id, t.title, t.status, t.due_date, u.full_name as supervisor_name
    FROM tasks t
    JOIN users u ON u.id = t.supervisor_id
    WHERE t.operario_id = ?
    ORDER BY t.due_date ASC
    LIMIT 5
  `).all(operarioId);

  res.json({
    taskTotal: taskTotal.cnt,
    taskDone: taskCompleted.cnt,
    taskPending: taskPending.cnt,
    recentTasks,
  });
});


/**
 * GET /worker/notifications?markRead=1
 * Devuelve notificaciones del usuario (operario)
 * Si markRead=1 marca todas como leídas antes de devolver.
 */
router.get("/notifications", auth, requireRole(["OPERARIO"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const mark = req.query.markRead === "1";

  const notifs = db.prepare(
    "SELECT id, message, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId);

  if (mark) {
    db.prepare(
      "UPDATE notifications SET read = 1 WHERE user_id = ?"
    ).run(userId);
  }

  res.json({ notifications: notifs });
});

/**
 * PATCH /worker/notifications/:id/read
 * Marca una notificación como leída
 */
router.patch("/notifications/:id/read", auth, requireRole(["OPERARIO"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const notifId = req.params.id;

  const n = db.prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?").get(notifId, userId);
  if (!n) return res.status(404).json({ error: "Notificación no encontrada" });

  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(notifId);
  res.json({ ok: true });
});

module.exports = { workerTasksRoutes: router };