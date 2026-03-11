import { http } from "./http";

export async function fetchSupervisores() {
  const { data } = await http.get("/admin/nomina/supervisors");
  return data.supervisors || [];
}

export async function fetchOperarios() {
  const { data } = await http.get("/admin/nomina/operarios");
  return data.operarios || [];
}

export async function fetchOperariosDeSupervisor(supervisorId) {
  const { data } = await http.get(`/admin/nomina/supervisors/${supervisorId}/workers`);
  return data.workers || [];
}

export async function assignOperario(supervisorId, operarioId) {
  const { data } = await http.post(`/admin/nomina/supervisors/${supervisorId}/workers/${operarioId}`);
  return data;
}

export async function unassignOperario(supervisorId, operarioId) {
  const { data } = await http.patch(`/admin/nomina/supervisors/${supervisorId}/workers/${operarioId}`, { active: false });
  return data;
}
