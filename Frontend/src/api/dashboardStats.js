import { http } from "./http";

/**
 * Obtener estadísticas del admin
 */
export async function fetchAdminStats() {
  const { data } = await http.get("/admin/stats");
  return data;
}

/**
 * Obtener estadísticas del supervisor logueado
 */
export async function fetchSupervisorStats() {
  const { data } = await http.get("/supervisor/stats");
  return data;
}

/**
 * Obtener estadísticas del operario logueado
 */
export async function fetchWorkerStats() {
  const { data } = await http.get("/worker/stats");
  return data;
}
