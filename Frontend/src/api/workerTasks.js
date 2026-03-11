import { http } from "./http";

export async function fetchMyTasks({ status } = {}) {
  const params = {};
  if (status) params.status = status;
  const { data } = await http.get("/worker/tasks", { params });
  return data.tasks || [];
}

export async function markTaskDone(taskId) {
  const { data } = await http.patch(`/worker/tasks/${taskId}/done`);
  return data;
}

export async function fetchNotifications(markRead = false) {
  const params = {};
  if (markRead) params.markRead = 1;
  const { data } = await http.get("/worker/notifications", { params });
  return data.notifications || [];
}

export async function markNotificationRead(id) {
  const { data } = await http.patch(`/worker/notifications/${id}/read`);
  return data;
}