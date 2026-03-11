import { http } from "./http";

// params opcionales: { from, to, supervisorId, operarioId, status }
export async function fetchAdminTasks(params = {}) {
  const { data } = await http.get("/admin/tasks", { params });
  return data.tasks || [];
}
