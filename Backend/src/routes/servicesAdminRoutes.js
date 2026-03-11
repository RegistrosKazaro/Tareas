const express = require("express");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

// Helper: validar supervisor
function assertSupervisor(db, supervisorId) {
  const sup = db
    .prepare(
      `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'SUPERVISOR'
    `
    )
    .get(supervisorId);

  return sup;
}

// Helper: validar servicio
function assertService(db, serviceId) {
  return db.prepare("SELECT id FROM services WHERE id = ?").get(serviceId);
}

// =========================
// CRUD de Servicios (ADMIN)
// =========================

// ✅ GET /admin/services
router.get("/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const rows = db
    .prepare(
      `
      SELECT id, name, active, created_at, updated_at
      FROM services
      ORDER BY name ASC
    `
    )
    .all();

  res.json({ services: rows });
});

// ✅ POST /admin/services  { name }
router.post("/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { name } = req.body || {};
  const n = String(name || "").trim();

  if (!n) return res.status(400).json({ error: "name es requerido" });

  const exists = db
    .prepare("SELECT id FROM services WHERE name = ? LIMIT 1")
    .get(n);
  if (exists) return res.status(409).json({ error: "Servicio ya existe" });

  const id = uuid();

  db.prepare(
    `
    INSERT INTO services (id, name, active, created_at, updated_at)
    VALUES (?, ?, 1, datetime('now'), datetime('now'))
  `
  ).run(id, n);

  res.status(201).json({ ok: true, service: { id, name: n, active: 1 } });
});

// ✅ PATCH /admin/services/:id  { name }
router.patch("/services/:id", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const id = req.params.id;
  const { name } = req.body || {};
  const n = String(name || "").trim();

  if (!n) return res.status(400).json({ error: "name es requerido" });

  const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Servicio no encontrado" });

  const dup = db
    .prepare("SELECT id FROM services WHERE name = ? AND id <> ? LIMIT 1")
    .get(n, id);
  if (dup) return res.status(409).json({ error: "Ya existe otro servicio con ese nombre" });

  db.prepare(
    `
    UPDATE services
    SET name = ?, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(n, id);

  res.json({ ok: true });
});

// ✅ PATCH /admin/services/:id/active  { active: boolean }
router.patch("/services/:id/active", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const id = req.params.id;
  const { active } = req.body || {};

  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active debe ser boolean" });
  }

  const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Servicio no encontrado" });

  db.prepare(
    `
    UPDATE services
    SET active = ?, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(active ? 1 : 0, id);

  res.json({ ok: true });
});

// =====================================
// Asignar Servicios a Supervisores (ADMIN)
// =====================================

// ✅ GET /admin/supervisors/:id/services
router.get("/supervisors/:id/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;

  const sup = assertSupervisor(db, supervisorId);
  if (!sup) return res.status(404).json({ error: "Supervisor no encontrado" });

  const rows = db
    .prepare(
      `
      SELECT s.id, s.name, s.active, ss.active AS link_active
      FROM supervisor_services ss
      JOIN services s ON s.id = ss.service_id
      WHERE ss.supervisor_id = ? AND ss.active = 1
      ORDER BY s.name ASC
    `
    )
    .all(supervisorId);

  res.json({ services: rows });
});

// ✅ POST /admin/supervisors/:id/services/assign { serviceId }
router.post("/supervisors/:id/services/assign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;
  const { serviceId } = req.body || {};

  if (!serviceId) return res.status(400).json({ error: "serviceId requerido" });

  const sup = assertSupervisor(db, supervisorId);
  if (!sup) return res.status(404).json({ error: "Supervisor no encontrado" });

  const srv = assertService(db, serviceId);
  if (!srv) return res.status(404).json({ error: "Servicio no encontrado" });

  db.prepare(
    `
    INSERT INTO supervisor_services (supervisor_id, service_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, service_id)
    DO UPDATE SET active = 1
  `
  ).run(supervisorId, serviceId);

  res.json({ ok: true });
});

// ✅ POST /admin/supervisors/:id/services/unassign { serviceId }
router.post("/supervisors/:id/services/unassign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;
  const { serviceId } = req.body || {};

  if (!serviceId) return res.status(400).json({ error: "serviceId requerido" });

  db.prepare(
    `
    UPDATE supervisor_services
    SET active = 0
    WHERE supervisor_id = ? AND service_id = ?
  `
  ).run(supervisorId, serviceId);

  res.json({ ok: true });
});

// =====================================
// ALIAS EN ESPAÑOL (para evitar 404 del front)
// =====================================

// ✅ GET /admin/supervisores/:id/services
router.get("/supervisores/:id/services", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;

  const sup = assertSupervisor(db, supervisorId);
  if (!sup) return res.status(404).json({ error: "Supervisor no encontrado" });

  const rows = db
    .prepare(
      `
      SELECT s.id, s.name, s.active, ss.active AS link_active
      FROM supervisor_services ss
      JOIN services s ON s.id = ss.service_id
      WHERE ss.supervisor_id = ? AND ss.active = 1
      ORDER BY s.name ASC
    `
    )
    .all(supervisorId);

  res.json({ services: rows });
});

// ✅ POST /admin/supervisores/:id/services/assign { serviceId }
router.post("/supervisores/:id/services/assign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;
  const { serviceId } = req.body || {};

  if (!serviceId) return res.status(400).json({ error: "serviceId requerido" });

  const sup = assertSupervisor(db, supervisorId);
  if (!sup) return res.status(404).json({ error: "Supervisor no encontrado" });

  const srv = assertService(db, serviceId);
  if (!srv) return res.status(404).json({ error: "Servicio no encontrado" });

  db.prepare(
    `
    INSERT INTO supervisor_services (supervisor_id, service_id, active, created_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, service_id)
    DO UPDATE SET active = 1
  `
  ).run(supervisorId, serviceId);

  res.json({ ok: true });
});

// ✅ POST /admin/supervisores/:id/services/unassign { serviceId }
router.post("/supervisores/:id/services/unassign", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const supervisorId = req.params.id;
  const { serviceId } = req.body || {};

  if (!serviceId) return res.status(400).json({ error: "serviceId requerido" });

  db.prepare(
    `
    UPDATE supervisor_services
    SET active = 0
    WHERE supervisor_id = ? AND service_id = ?
  `
  ).run(supervisorId, serviceId);

  res.json({ ok: true });
});

module.exports = { servicesAdminRoutes: router };

