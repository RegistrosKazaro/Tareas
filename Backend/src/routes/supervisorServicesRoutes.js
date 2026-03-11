const express = require("express");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

/**
 * GET /supervisor/services
 * Lista servicios asignados al supervisor (por admin) y activos
 */
router.get("/services", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;

  const rows = db.prepare(`
    SELECT s.id, s.name, s.description, s.active AS service_active, ss.active AS assigned_active
    FROM supervisor_services ss
    JOIN services s ON s.id = ss.service_id
    WHERE ss.supervisor_id = ?
    ORDER BY s.name ASC
  `).all(req.user.id);

  res.json({ services: rows });
});

/**
 * GET /supervisor/workers/:operarioId/services
 * Lista servicios que el supervisor le asignó a ese operario
 */
router.get("/workers/:operarioId/services", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const { operarioId } = req.params;

  // validar que el operario esté en mi nómina
  const rel = db.prepare(`
    SELECT supervisor_id, operario_id, active
    FROM supervisor_operarios
    WHERE supervisor_id = ? AND operario_id = ?
  `).get(req.user.id, operarioId);

  if (!rel) return res.status(404).json({ error: "Operario no está en tu nómina" });

  const rows = db.prepare(`
    SELECT
      s.id, s.name, s.description,
      s.active AS service_active,
      ws.active AS assigned_active
    FROM worker_services ws
    JOIN services s ON s.id = ws.service_id
    WHERE ws.supervisor_id = ? AND ws.operario_id = ?
    ORDER BY s.name ASC
  `).all(req.user.id, operarioId);

  res.json({ operarioId, services: rows });
});

/**
 * POST /supervisor/workers/:operarioId/services/:serviceId
 * Asigna un servicio al operario:
 * - el servicio debe estar asignado al supervisor (admin)
 * - el operario debe estar en la nómina del supervisor
 */
router.post("/workers/:operarioId/services/:serviceId", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const { operarioId, serviceId } = req.params;

  // validar nómina activa
  const rel = db.prepare(`
    SELECT supervisor_id, operario_id, active
    FROM supervisor_operarios
    WHERE supervisor_id = ? AND operario_id = ?
  `).get(req.user.id, operarioId);

  if (!rel) return res.status(404).json({ error: "Operario no está en tu nómina" });
  if (rel.active !== 1) return res.status(400).json({ error: "Operario está desactivado en tu nómina" });

  // validar que el supervisor tenga ese servicio asignado y activo
  const ss = db.prepare(`
    SELECT ss.active as assigned_active, s.active as service_active
    FROM supervisor_services ss
    JOIN services s ON s.id = ss.service_id
    WHERE ss.supervisor_id = ? AND ss.service_id = ?
  `).get(req.user.id, serviceId);

  if (!ss) return res.status(404).json({ error: "Ese servicio no está asignado al supervisor" });
  if (ss.assigned_active !== 1) return res.status(400).json({ error: "Servicio desasignado al supervisor" });
  if (ss.service_active !== 1) return res.status(400).json({ error: "Servicio está inactivo" });

  // Insert o reactivar worker_services
  db.prepare(`
    INSERT INTO worker_services (supervisor_id, operario_id, service_id, active, created_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT(supervisor_id, operario_id, service_id)
    DO UPDATE SET active = 1
  `).run(req.user.id, operarioId, serviceId);

  res.json({ ok: true });
});

/**
 * PATCH /supervisor/workers/:operarioId/services/:serviceId
 * body: { active: true|false }
 * Desasignar / reactivar servicio a operario
 */
router.patch("/workers/:operarioId/services/:serviceId", auth, requireRole(["SUPERVISOR"]), (req, res) => {
  const db = req.app.locals.db;
  const { operarioId, serviceId } = req.params;
  const { active } = req.body || {};

  if (typeof active !== "boolean") return res.status(400).json({ error: "active debe ser boolean" });

  const existing = db.prepare(`
    SELECT supervisor_id, operario_id, service_id
    FROM worker_services
    WHERE supervisor_id = ? AND operario_id = ? AND service_id = ?
  `).get(req.user.id, operarioId, serviceId);

  if (!existing) return res.status(404).json({ error: "Asignación no existe" });

  db.prepare(`
    UPDATE worker_services
    SET active = ?
    WHERE supervisor_id = ? AND operario_id = ? AND service_id = ?
  `).run(active ? 1 : 0, req.user.id, operarioId, serviceId);

  res.json({ ok: true });
});

module.exports = { supervisorServicesRoutes: router };
