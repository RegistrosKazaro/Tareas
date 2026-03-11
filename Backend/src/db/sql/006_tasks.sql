-- Tareas
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  supervisor_id TEXT NOT NULL,
  operario_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  done_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (supervisor_id) REFERENCES users(id),
  FOREIGN KEY (operario_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_operario_due ON tasks(operario_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_supervisor_due ON tasks(supervisor_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
