-- Asignación de servicios a operarios (por supervisor)
CREATE TABLE IF NOT EXISTS worker_services (
  supervisor_id TEXT NOT NULL,
  operario_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (supervisor_id, operario_id, service_id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id),
  FOREIGN KEY (operario_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_worker_services_supervisor ON worker_services(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_operario ON worker_services(operario_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_service ON worker_services(service_id);
