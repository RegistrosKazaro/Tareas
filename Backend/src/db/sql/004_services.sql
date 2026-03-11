-- Servicios
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

-- Asignación de servicios a supervisores
CREATE TABLE IF NOT EXISTS supervisor_services (
  supervisor_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (supervisor_id, service_id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_supervisor_services_supervisor ON supervisor_services(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_services_service ON supervisor_services(service_id);
