import { http } from "./http";

export async function fetchSupervisorTasks({ status, operarioId, from, to } = {}) {
  const params = {};
  if (status) params.status = status;
  if (operarioId) params.operarioId = operarioId;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await http.get("/supervisor/tasks", { params });
  return data.tasks || [];
}

export async function createSupervisorTask(payload) {
  const { data } = await http.post("/supervisor/tasks", payload);
  return data.task;
}

export async function updateSupervisorTask(taskId, payload) {
  const { data } = await http.patch(`/supervisor/tasks/${taskId}`, payload);
  return data.task;
}

export async function deleteSupervisorTask(taskId) {
  const { data } = await http.delete(`/supervisor/tasks/${taskId}`);
  return data;
}