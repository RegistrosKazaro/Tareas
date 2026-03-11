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

/**
 * POST /admin/services
 * body: { name, description? }
 */
router.post("/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { name, description } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name es requerido" });
  }

  const cleanName = String(name).trim();

  const exists = db.prepare("SELECT id FROM services WHERE name = ? LIMIT 1").get(cleanName);
  if (exists) return res.status(409).json({ error: "Ya existe un servicio con ese name" });

  const id = uuid();

  db.prepare(`
    INSERT INTO services (id, name, description, active, created_at, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
  `).run(id, cleanName, description ? String(description) : null);

  res.status(201).json({ ok: true, service: { id, name: cleanName, description: description || null, active: 1 } });
});

/**
 * GET /admin/services
 * lista servicios (opcional ?active=1|0)
 */
router.get("/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const activeParam = req.query.active;
  let rows;

  if (activeParam === "1" || activeParam === "0") {
    rows = db.prepare(`
      SELECT id, name, description, active, created_at, updated_at
      FROM services
      WHERE active = ?
      ORDER BY name ASC
    `).all(Number(activeParam));
  } else {
    rows = db.prepare(`
      SELECT id, name, description, active, created_at, updated_at
      FROM services
      ORDER BY name ASC
    `).all();
  }

  res.json({ services: rows });
});

/**
 * PATCH /admin/services/:id
 * body: { name?, description? }
 */
router.patch("/services/:id", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { name, description } = req.body || {};

  const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Servicio no existe" });

  // Validar name si viene
  if (name !== undefined) {
    const cleanName = String(name).trim();
    if (!cleanName) return res.status(400).json({ error: "name no puede ser vacío" });

    const other = db.prepare("SELECT id FROM services WHERE name = ? AND id <> ?").get(cleanName, id);
    if (other) return res.status(409).json({ error: "Ya existe otro servicio con ese name" });

    db.prepare(`
      UPDATE services
      SET name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(cleanName, id);
  }

  if (description !== undefined) {
    db.prepare(`
      UPDATE services
      SET description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(description === null ? null : String(description), id);
  }

  const row = db.prepare("SELECT id, name, description, active, created_at, updated_at FROM services WHERE id = ?").get(id);
  res.json({ ok: true, service: row });
});

/**
 * PATCH /admin/services/:id/active
 * body: { active: true|false }
 */
router.patch("/services/:id/active", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { active } = req.body || {};

  if (typeof active !== "boolean") return res.status(400).json({ error: "active debe ser boolean" });

  const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Servicio no existe" });

  db.prepare(`
    UPDATE services
    SET active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(active ? 1 : 0, id);

  res.json({ ok: true });
});

/**
 * POST /admin/supervisors/:supervisorId/services/:serviceId
 * Asignar servicio a supervisor (o reactivar)
 */
router.post("/supervisors/:supervisorId/services/:serviceId", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, serviceId } = req.params;

  // Validar supervisor
  const sup = db.prepare(`
    SELECT u.id, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `).get(supervisorId);

  if (!sup) return res.status(404).json({ error: "Supervisor no existe" });
  if (sup.role !== "SUPERVISOR") return res.status(400).json({ error: "El usuario no es SUPERVISOR" });

  // Validar service
  const svc = db.prepare(`SELECT id FROM services WHERE id = ?`).get(serviceId);
  if (!svc) return res.status(404).json({ error: "Servicio no existe" });

  db.prepare(`
    INSERT INTO supervisor_services (supervisor_id, service_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, service_id)
    DO UPDATE SET active = 1
  `).run(supervisorId, serviceId);

  res.json({ ok: true });
});

/**
 * GET /admin/supervisors/:supervisorId/services
 * Lista servicios asignados al supervisor
 */
router.get("/supervisors/:supervisorId/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId } = req.params;

  const rows = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.description,
      s.active AS service_active,
      ss.active AS assigned_active
    FROM supervisor_services ss
    JOIN services s ON s.id = ss.service_id
    WHERE ss.supervisor_id = ?
    ORDER BY s.name ASC
  `).all(supervisorId);

  res.json({ supervisorId, services: rows });
});

/**
 * PATCH /admin/supervisors/:supervisorId/services/:serviceId
 * body: { active: true|false }  -> desasignar/reactivar
 */
router.patch("/supervisors/:supervisorId/services/:serviceId", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { supervisorId, serviceId } = req.params;
  const { active } = req.body || {};

  if (typeof active !== "boolean") return res.status(400).json({ error: "active debe ser boolean" });

  const existing = db.prepare(`
    SELECT supervisor_id, service_id
    FROM supervisor_services
    WHERE supervisor_id = ? AND service_id = ?
  `).get(supervisorId, serviceId);

  if (!existing) return res.status(404).json({ error: "Asignación supervisor-servicio no existe" });

  db.prepare(`
    UPDATE supervisor_services
    SET active = ?
    WHERE supervisor_id = ? AND service_id = ?
  `).run(active ? 1 : 0, supervisorId, serviceId);

  res.json({ ok: true });
});

module.exports = { adminServicesRoutes: router };
