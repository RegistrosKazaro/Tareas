CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

CREATE INDEX IF NOT EXISTS idx_supervisor_operarios_supervisor
  ON supervisor_operarios (supervisor_id);

CREATE INDEX IF NOT EXISTS idx_supervisor_operarios_operario
  ON supervisor_operarios (operario_id);
