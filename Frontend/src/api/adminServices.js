import { http } from "./http";

// ===== CRUD Servicios =====
export async function fetchServices() {
  const { data } = await http.get("/admin/services");
  return data.services || [];
}

export async function createService(name) {
  const { data } = await http.post("/admin/services", { name });
  return data.service;
}

export async function updateService(id, name) {
  const { data } = await http.patch(`/admin/services/${id}`, { name });
  return data;
}

export async function setServiceActive(id, active) {
  const { data } = await http.patch(`/admin/services/${id}/active`, { active });
  return data;
}

// ===== Asignación Supervisor <-> Servicios =====
export async function fetchSupervisorServices(supervisorId) {
  const { data } = await http.get(`/admin/supervisors/${supervisorId}/services`);
  return data.services || [];
}

export async function assignServiceToSupervisor(supervisorId, serviceId) {
  const { data } = await http.post(
    `/admin/supervisors/${supervisorId}/services/${serviceId}`
  );
  return data;
}

export async function unassignServiceFromSupervisor(supervisorId, serviceId) {
  const { data } = await http.patch(
    `/admin/supervisors/${supervisorId}/services/${serviceId}`,
    { active: false }
  );
  return data;
}
