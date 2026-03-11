PRAGMA foreign_keys = ON;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS supervisor_operarios (
  supervisor_id TEXT NOT NULL,
  operario_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (supervisor_id, operario_id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id),
  FOREIGN KEY (operario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sync_ack (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  op_id TEXT NOT NULL,
  op_type TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  result TEXT,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
