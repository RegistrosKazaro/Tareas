// Backend/src/routes/supervisorTasksRoutes.js
const express = require("express");
const crypto = require("crypto");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isISODate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/**
 * POST /supervisor/tasks
 * body: { operarioId, title, description?, dueDate(YYYY-MM-DD), serviceId? }
 *
 * reglas:
 * - operario debe estar en nómina activa del supervisor
 * - si serviceId viene: debe estar asignado al supervisor y activo
 * - si serviceId viene: también se asigna/re-activa worker_services (operario <-> service)
 */
// POST /supervisor/tasks
// body: { operarioId, title, description?, dueDate(YYYY-MM-DD), serviceId }
router.post("/tasks", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const { operarioId, title, description, dueDate, serviceId } = req.body || {};

  // ✅ ahora serviceId es obligatorio
  if (!operarioId || !title || !isISODate(dueDate) || !serviceId) {
    return res.status(400).json({
      error: "operarioId, title, dueDate(YYYY-MM-DD) y serviceId son requeridos",
    });
  }

  // 1) validar nómina activa
  const rel = db.prepare(`
    SELECT active
    FROM supervisor_operarios
    WHERE supervisor_id = ? AND operario_id = ?
  `).get(req.user.id, operarioId);

  if (!rel) return res.status(404).json({ error: "Operario no está en tu nómina" });
  if (rel.active !== 1) return res.status(400).json({ error: "Operario está desactivado en tu nómina" });

  // 2) validar que el supervisor tenga el servicio asignado y activo
  const ss = db.prepare(`
    SELECT ss.active as assigned_active, s.active as service_active
    FROM supervisor_services ss
    JOIN services s ON s.id = ss.service_id
    WHERE ss.supervisor_id = ? AND ss.service_id = ?
  `).get(req.user.id, serviceId);

  if (!ss) return res.status(404).json({ error: "Servicio no está asignado al supervisor" });
  if (ss.assigned_active !== 1) return res.status(400).json({ error: "Servicio desasignado al supervisor" });
  if (ss.service_active !== 1) return res.status(400).json({ error: "Servicio inactivo" });

  // ✅ 3) “Asignar el servicio al operario” (upsert worker_services)
  db.prepare(`
    INSERT INTO worker_services (supervisor_id, operario_id, service_id, active, created_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, operario_id, service_id)
    DO UPDATE SET active = 1
  `).run(req.user.id, operarioId, serviceId);

  // 4) crear tarea ligada al servicio
  const id = uuid();

  db.prepare(`
    INSERT INTO tasks (
      id, supervisor_id, operario_id, service_id, title, description,
      due_date, status, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))
  `).run(
    id,
    req.user.id,
    operarioId,
    serviceId,
    String(title).trim(),
    description ? String(description) : null,
    dueDate
  );

  const task = db.prepare(`
    SELECT
      t.id, t.supervisor_id, t.operario_id, t.service_id,
      t.title, t.description, t.due_date, t.status, t.done_at, t.created_at, t.updated_at,
      s.name AS service_name
    FROM tasks t
    LEFT JOIN services s ON s.id = t.service_id
    WHERE t.id = ?
  `).get(id);

  // crear notificación para el operario asignado
  const notifId = uuid();
  const message = `📋 Nueva tarea: "${task.title}"`;
  db.prepare(
    "INSERT INTO notifications (id, user_id, message, read, created_at) VALUES (?, ?, ?, 0, datetime('now'))"
  ).run(notifId, operarioId, message);

  res.status(201).json({ ok: true, task });
});

/**
 * GET /supervisor/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD&operarioId=&status=PENDING|DONE
 * lista tareas creadas por el supervisor
 */
router.get("/tasks", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const { from, to, operarioId, status } = req.query;

  const filters = ["t.supervisor_id = ?"];
  const params = [req.user.id];

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
  if (operarioId) {
    filters.push("t.operario_id = ?");
    params.push(operarioId);
  }
  if (status) {
  const s = String(status).toUpperCase();
  if (s !== "PENDING" && s !== "DONE") {
    return res.status(400).json({ error: "status inválido" });
  }
  filters.push("t.status = ?");
  params.push(s);
}

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT
        t.id, t.title, t.description, t.due_date, t.status, t.done_at,
        t.operario_id, u.full_name AS operario_name, u.username AS operario_username,
        t.service_id, s.name AS service_name,
        t.created_at, t.updated_at
      FROM tasks t
      JOIN users u ON u.id = t.operario_id
      LEFT JOIN services s ON s.id = t.service_id
      ${where}
      ORDER BY t.due_date DESC, t.created_at DESC
    `
    )
    .all(...params);

  res.json({ tasks: rows });
});

/**
 * PATCH /supervisor/tasks/:id
 * body: { title?, description?, dueDate?, serviceId? }
 * Editar tarea (solo si aún está PENDING)
 */
router.patch("/tasks/:id", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const taskId = req.params.id;
  const { title, description, dueDate, serviceId } = req.body || {};

  const task = db.prepare(`
    SELECT id, supervisor_id, status, operario_id
    FROM tasks
    WHERE id = ?
  `).get(taskId);

  if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
  if (task.supervisor_id !== req.user.id) return res.status(403).json({ error: "No autorizado" });
  if (task.status !== "PENDING") return res.status(400).json({ error: "Solo se pueden editar tareas PENDING" });

  // Validar title
  if (title !== undefined) {
    const t = String(title || "").trim();
    if (!t) return res.status(400).json({ error: "title no puede estar vacío" });
    db.prepare(`UPDATE tasks SET title = ?, updated_at = datetime('now') WHERE id = ?`).run(t, taskId);
  }

  // Validar description
  if (description !== undefined) {
    db.prepare(`UPDATE tasks SET description = ?, updated_at = datetime('now') WHERE id = ?`).run(
      description ? String(description) : null,
      taskId
    );
  }

  // Validar dueDate
  if (dueDate !== undefined) {
    if (!isISODate(dueDate)) return res.status(400).json({ error: "dueDate inválido (YYYY-MM-DD)" });
    db.prepare(`UPDATE tasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?`).run(dueDate, taskId);
  }

  // Validar serviceId
  if (serviceId !== undefined) {
    const ss = db.prepare(`
      SELECT ss.active as assigned_active, s.active as service_active
      FROM supervisor_services ss
      JOIN services s ON s.id = ss.service_id
      WHERE ss.supervisor_id = ? AND ss.service_id = ?
    `).get(req.user.id, serviceId);

    if (!ss) return res.status(404).json({ error: "Servicio no está asignado al supervisor" });
    if (ss.assigned_active !== 1) return res.status(400).json({ error: "Servicio desasignado al supervisor" });
    if (ss.service_active !== 1) return res.status(400).json({ error: "Servicio inactivo" });

    // Upsert worker_services
    db.prepare(`
      INSERT INTO worker_services (supervisor_id, operario_id, service_id, active, created_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT(supervisor_id, operario_id, service_id)
      DO UPDATE SET active = 1
    `).run(req.user.id, task.operario_id, serviceId);

    db.prepare(`UPDATE tasks SET service_id = ?, updated_at = datetime('now') WHERE id = ?`).run(serviceId, taskId);
  }

  const updated = db.prepare(`
    SELECT
      t.id, t.title, t.description, t.due_date, t.status, t.done_at,
      t.operario_id, u.full_name AS operario_name, u.username AS operario_username,
      t.service_id, s.name AS service_name,
      t.created_at, t.updated_at
    FROM tasks t
    JOIN users u ON u.id = t.operario_id
    LEFT JOIN services s ON s.id = t.service_id
    WHERE t.id = ?
  `).get(taskId);

  res.json({ ok: true, task: updated });
});

/**
 * DELETE /supervisor/tasks/:id
 * Borrar tarea (solo si está PENDING)
 */
router.delete("/tasks/:id", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const taskId = req.params.id;

  const task = db.prepare(`
    SELECT id, supervisor_id, status
    FROM tasks
    WHERE id = ?
  `).get(taskId);

  if (!task) return res.status(404).json({ error: "Tarea no encontrada" });
  if (task.supervisor_id !== req.user.id) return res.status(403).json({ error: "No autorizado" });
  if (task.status !== "PENDING") return res.status(400).json({ error: "Solo se pueden borrar tareas PENDING" });

  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(taskId);

  res.json({ ok: true });
});

module.exports = { supervisorTasksRoutes: router };