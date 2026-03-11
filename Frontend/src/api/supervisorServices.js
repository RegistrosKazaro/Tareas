// src/api/supervisorServices.js
import { http } from "./http";

export async function fetchSupervisorServices() {
  const { data } = await http.get("/supervisor/services");
  return data.services || [];
}

export async function fetchWorkerServices(operarioId) {
  const { data } = await http.get(`/supervisor/workers/${operarioId}/services`);
  return data.services || [];
}

export async function assignServiceToWorker(operarioId, serviceId) {
  const { data } = await http.post(`/supervisor/workers/${operarioId}/services/${serviceId}`);
  return data;
}

export async function setWorkerServiceActive(operarioId, serviceId, active) {
  const { data } = await http.patch(`/supervisor/workers/${operarioId}/services/${serviceId}`, { active });
  return data;
}