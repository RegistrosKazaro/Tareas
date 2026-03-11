import { http } from "./http";

// GET /admin/users?role=SUPERVISOR|OPERARIO
export async function fetchUsers(role) {
  const params = {};
  if (role) params.role = role;

  const { data } = await http.get("/admin/users", { params });
  return data.users || [];
}

// POST /admin/users
export async function createUser({ fullName, username, password, role }) {
  const { data } = await http.post("/admin/users", {
    fullName,
    username,
    password,
    role,
  });
  return data.user;
}

// PATCH /admin/users/:id
export async function updateUser(id, { fullName, username, role }) {
  const { data } = await http.patch(`/admin/users/${id}`, {
    fullName,
    username,
    role,
  });
  return data;
}

// PATCH /admin/users/:id/active
export async function setUserActive(id, active) {
  const { data } = await http.patch(`/admin/users/${id}/active`, { active });
  return data;
}

// POST /admin/users/:id/reset-password
export async function resetUserPassword(id, newPassword) {
  const { data } = await http.post(`/admin/users/${id}/reset-password`, {
    password: newPassword,
  });
  return data;
}

// DELETE /admin/users/:id
export async function deleteUser(id) {
  const { data } = await http.delete(`/admin/users/${id}`);
  return data;
}
