const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

// Generar UUID
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeRole(role) {
  const r = String(role || "").trim().toUpperCase();
  if (r === "SUPERVISOR" || r === "OPERARIO" || r === "ADMIN") return r;
  return null;
}

// ✅ POST /admin/users  (crear usuario)
router.post("/users", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const { fullName, username, password, role } = req.body || {};
  const roleName = normalizeRole(role);

  if (!fullName || !username || !password || !roleName) {
    return res.status(400).json({
      error: "fullName, username, password, role are required (SUPERVISOR|OPERARIO)",
    });
  }

  if (roleName === "ADMIN") {
    return res.status(400).json({ error: "No se permite crear ADMIN desde este endpoint" });
  }

  const roleRow = db.prepare("SELECT id FROM roles WHERE name = ? LIMIT 1").get(roleName);
  if (!roleRow) return res.status(400).json({ error: "Role no existe en DB" });

  const exists = db.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").get(username);
  if (exists) return res.status(409).json({ error: "username ya existe" });

  const userId = uuid();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, role_id, full_name, username, password_hash, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `).run(userId, roleRow.id, fullName, username, hash);

  res.status(201).json({
    ok: true,
    user: { id: userId, fullName, username, role: roleName, active: true },
  });
});

// ✅ GET /admin/users (listar usuarios)
router.get("/users", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const roleFilter = req.query.role ? normalizeRole(req.query.role) : null;
  if (req.query.role && !roleFilter) {
    return res.status(400).json({ error: "role filter inválido" });
  }

  let rows;
  if (roleFilter) {
    rows = db.prepare(`
      SELECT u.id, u.full_name, u.username, r.name AS role, u.active, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = ?
      ORDER BY u.created_at DESC
    `).all(roleFilter);
  } else {
    rows = db.prepare(`
      SELECT u.id, u.full_name, u.username, r.name AS role, u.active, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `).all();
  }

  res.json({ users: rows });
});

// ✅ PATCH /admin/users/:id/active  (activar/desactivar)
router.patch("/users/:id/active", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.params.id;
  const { active } = req.body || {};

  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "active debe ser boolean" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!existing) return res.status(404).json({ error: "User not found" });

  if (existing.id === req.user.id && active === false) {
    return res.status(400).json({ error: "No podés desactivarte a vos mismo" });
  }

  db.prepare(`UPDATE users SET active = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(active ? 1 : 0, userId);

  res.json({ ok: true });
});

// ✅ PATCH /admin/users/:id  (editar usuario)
router.patch("/users/:id", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.params.id;

  const { fullName, username, role, active } = req.body || {};

  const existing = db.prepare(`
    SELECT u.id, u.username, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
  `).get(userId);

  if (!existing) return res.status(404).json({ error: "User not found" });

  // --- fullName ---
  if (fullName !== undefined) {
    const v = String(fullName).trim();
    if (!v) return res.status(400).json({ error: "fullName no puede ser vacío" });

    db.prepare(`
      UPDATE users
      SET full_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(v, userId);
  }

  // --- username ---
  if (username !== undefined) {
    const v = String(username).trim();
    if (!v) return res.status(400).json({ error: "username no puede ser vacío" });

    const exists = db.prepare(`SELECT id FROM users WHERE username = ? AND id <> ?`).get(v, userId);
    if (exists) return res.status(409).json({ error: "username ya existe" });

    db.prepare(`
      UPDATE users
      SET username = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(v, userId);
  }

  // --- active (opcional, por si lo querés manejar también acá) ---
  if (active !== undefined) {
    if (typeof active !== "boolean") return res.status(400).json({ error: "active debe ser boolean" });

    if (userId === req.user.id && active === false) {
      return res.status(400).json({ error: "No podés desactivarte a vos mismo" });
    }

    db.prepare(`
      UPDATE users
      SET active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(active ? 1 : 0, userId);
  }

  // --- role ---
  if (role !== undefined) {
    const roleName = normalizeRole(role);
    if (!roleName) return res.status(400).json({ error: "role inválido (ADMIN|SUPERVISOR|OPERARIO)" });

    // Si querés evitar que se cambie a ADMIN desde panel, dejalo así:
    // (si sí querés permitirlo, borrá este IF)
    if (roleName === "ADMIN") {
      return res.status(400).json({ error: "No se permite asignar ADMIN desde este endpoint" });
    }

    const roleRow = db.prepare("SELECT id FROM roles WHERE name = ? LIMIT 1").get(roleName);
    if (!roleRow) return res.status(400).json({ error: "Role no existe en DB" });

    db.prepare(`
      UPDATE users
      SET role_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(roleRow.id, userId);
  }

  // Devolver usuario actualizado
  const updated = db.prepare(`
    SELECT u.id, u.full_name, u.username, r.name AS role, u.active, u.created_at, u.updated_at
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
  `).get(userId);

  res.json({ ok: true, user: updated });
});

// ✅ PATCH /admin/users/:id/password  (reset password)
router.patch("/users/:id/password", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.params.id;
  const { password } = req.body || {};

  if (!password || String(password).trim().length < 6) {
    return res.status(400).json({ error: "password requerido (mínimo 6 caracteres)" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!existing) return res.status(404).json({ error: "User not found" });

  const hash = bcrypt.hashSync(String(password), 10);

  db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(hash, userId);

  res.json({ ok: true });
});

// ✅ DELETE /admin/users/:id (eliminar usuario)
router.delete("/users/:id", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.params.id;

  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!existing) return res.status(404).json({ error: "User not found" });

  if (existing.id === req.user.id) {
    return res.status(400).json({ error: "No podés eliminarte a vos mismo" });
  }

  // contar tareas relacionadas (supervisor u operario)
  const taskCount = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM tasks WHERE supervisor_id = ? OR operario_id = ?"
    )
    .get(userId, userId).cnt;

  // borrar relaciones simples antes de eliminar el usuario
  db.prepare("DELETE FROM supervisor_services WHERE supervisor_id = ?").run(userId);
  db.prepare("DELETE FROM worker_services WHERE supervisor_id = ? OR operario_id = ?").run(userId, userId);
  db.prepare("DELETE FROM supervisor_operarios WHERE supervisor_id = ? OR operario_id = ?").run(userId, userId);
  db.prepare("DELETE FROM devices WHERE user_id = ?").run(userId);
  db.prepare(
    "DELETE FROM sync_ack WHERE device_id IN (SELECT id FROM devices WHERE user_id = ?)",
  ).run(userId);
  // borrar notificaciones ligadas al usuario (evita FK failures)
  db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
  // eliminar tareas si existen (cascade)
  if (taskCount > 0) {
    db.prepare("DELETE FROM tasks WHERE supervisor_id = ? OR operario_id = ?").run(userId, userId);
  }

  // finalmente borrar usuario
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);

  const resp = { ok: true };
  if (taskCount > 0) resp.deletedTasks = taskCount;
  res.json(resp);
});

router.post("/users/:id/reset-password", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;
  const userId = req.params.id;

  const password = req.body?.password ?? req.body?.newPassword;

  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "password mínimo 6 caracteres" });
  }

  const existing = db
    .prepare(
      `
      SELECT u.id, u.active, r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `
    )
    .get(userId);

  if (!existing) return res.status(404).json({ error: "User not found" });

  // (opcional) evitar resetear al admin logueado si no querés
  // if (existing.id === req.user.id) {
  //   return res.status(400).json({ error: "No podés resetear tu propia contraseña desde acá" });
  // }

  const hash = bcrypt.hashSync(String(password), 10);

  db.prepare(
    `
    UPDATE users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(hash, userId);

  return res.json({ ok: true });
});

/**
 * GET /admin/stats
 * Estadísticas generales del sistema
 */
router.get("/stats", auth, requireRole(["ADMIN"]), (req, res) => {
  const db = req.app.locals.db;

  const userCount = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
  const supervisorCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'SUPERVISOR')").get();
  const operarioCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'OPERARIO')").get();
  const serviceCount = db.prepare("SELECT COUNT(*) as cnt FROM services WHERE active = 1").get();
  const taskCount = db.prepare("SELECT COUNT(*) as cnt FROM tasks").get();
  const taskCompleted = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'DONE'").get();
  const taskPending = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'PENDING'").get();

  res.json({
    users: userCount.cnt,
    supervisors: supervisorCount.cnt,
    operarios: operarioCount.cnt,
    services: serviceCount.cnt,
    taskTotal: taskCount.cnt,
    taskDone: taskCompleted.cnt,
    taskPending: taskPending.cnt,
  });
});


module.exports = { adminRoutes: router };
