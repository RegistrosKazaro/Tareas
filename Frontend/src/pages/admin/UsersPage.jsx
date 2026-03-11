import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import {
  fetchUsers,
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
  deleteUser,
} from "../../api/adminUsers";


const ROLES = ["SUPERVISOR", "OPERARIO"];

function fmtActive(a) {
  return a === 1 || a === true ? "Activo" : "Inactivo";
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(""); // "" | SUPERVISOR | OPERARIO
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ type: "ok", message: "" });

  // modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // user or null

  // modal reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  // modal delete user
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // form create/edit
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("OPERARIO");
  const [formErrors, setFormErrors] = useState({ fullName: "", username: "", password: "" });

  // create password
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // reset password
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const list = await fetchUsers(roleFilter || undefined);
      setUsers(list);
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error cargando usuarios",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const filtered = useMemo(() => users, [users]);

  function openCreate() {
    setEditing(null);
    setFullName("");
    setUsername("");
    setRole("OPERARIO");
    setPassword("");
    setShowPassword(false);
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setFullName(u.full_name);
    setUsername(u.username);
    setRole(u.role);
    setPassword(""); // no se edita acá
    setShowPassword(false);
    setModalOpen(true);
  }

  function openReset(u) {
    setResetUser(u);
    setNewPass("");
    setShowNewPass(false);
    setResetOpen(true);
  }

  function openDelete(u) {
    setDeleteTarget(u);
    setDeleteConfirmOpen(true);
  }

  async function onSaveUser(e) {
    e.preventDefault();
    // inline validation
    const errs = { fullName: "", username: "", password: "" };
    if (!fullName.trim()) errs.fullName = "Nombre requerido";
    if (!username.trim()) errs.username = "Usuario requerido";
    if (!editing) {
      if (!password || password.length < 6) errs.password = "Password mínimo 6 caracteres";
    }
    setFormErrors(errs);
    if (errs.fullName || errs.username || errs.password) return;

    try {
      if (!editing) {
        await createUser({ fullName, username, password, role });
        setToast({ type: "ok", message: "Usuario creado" });
      } else {
        const payload = { fullName, username, role };
        await updateUser(editing.id, payload);
        setToast({ type: "ok", message: "Usuario actualizado" });
      }

      setModalOpen(false);
      await load();
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error guardando usuario" });
    }
  }

  async function toggleActive(u) {
    try {
      const next = !(u.active === 1 || u.active === true);
      await setUserActive(u.id, next);
      setToast({
        type: "ok",
        message: `Usuario ${next ? "activado" : "desactivado"}`,
      });
      await load();
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error cambiando estado",
      });
    }
  }

  async function onDeleteUser() {
    if (!deleteTarget) return;
    try {
      const resp = await deleteUser(deleteTarget.id);
      let msg = "Usuario eliminado";
      if (resp.deletedTasks) {
        msg += ` (se eliminaron ${resp.deletedTasks} tareas asociadas)`;
      }
      setToast({ type: "ok", message: msg });
      setDeleteConfirmOpen(false);
      await load();
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error eliminando usuario",
      });
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    if (!resetUser) return;

    if (!newPass || newPass.length < 6) {
      setToast({ type: "warn", message: "Password mínimo 6 caracteres" });
      return;
    }

    try {
      await resetUserPassword(resetUser.id, newPass);
      setToast({ type: "ok", message: "Contraseña reseteada" });
      setResetOpen(false);
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error reseteando contraseña",
      });
    }
  }

  return (
    <div className="container">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "ok", message: "" })}
      />

      <div className="card">
        <div className="cardHeader">
          <div className="row">
            <div>
              <h1 className="h1">Usuarios</h1>
              <p className="sub">Crear, editar, activar/desactivar y resetear contraseña.</p>
            </div>

            <div className="toolbar">
              <div style={{ minWidth: 220 }}>
                <label className="label" htmlFor="roleFilter">
                  Filtro por rol
                </label>
                <select
                  id="roleFilter"
                  className="input"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filtrar por rol"
                >
                  <option value="">Todos</option>
                  <option value="SUPERVISOR">Supervisores</option>
                  <option value="OPERARIO">Operarios</option>
                </select>
              </div>

              <button className="btn btnPrimary" onClick={openCreate} type="button">
                + Crear usuario
              </button>
            </div>
          </div>

          <hr className="sep" />
        </div>

        <div className="cardBody">
          {loading ? (
            <p className="sub">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="sub">No hay usuarios para mostrar.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                aria-label="Lista de usuarios"
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 720,
                }}
              >
                <thead>
                  <tr>
                    <th scope="col" align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                      Nombre
                    </th>
                    <th scope="col" align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                      Usuario
                    </th>
                    <th scope="col" align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                      Rol
                    </th>
                    <th scope="col" align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                      Estado
                    </th>
                    <th scope="col" align="right" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((u) => {
                    const isActive = u.active === 1 || u.active === true;
                    return (
                      <tr key={u.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <strong>{u.full_name}</strong>
                          
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>{u.username}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>{u.role}</td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <span
                            style={{
                              fontWeight: 800,
                              color: isActive ? "var(--green-700)" : "var(--muted)",
                            }}
                          >
                            {fmtActive(u.active)}
                          </span>
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button className="btn btnSecondary" type="button" onClick={() => openEdit(u)}>
                              Editar
                            </button>

                            <button className="btn btnInfo" type="button" onClick={() => openReset(u)}>
                              Reset pass
                            </button>

                            <button
                              className={`btn ${isActive ? "btnWarn" : "btnPrimary"}`}
                              type="button"
                              onClick={() => toggleActive(u)}
                            >
                              {isActive ? "Desactivar" : "Activar"}
                            </button>

                            <button
                              className="btn btnDanger"
                              type="button"
                              onClick={() => openDelete(u)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal open={modalOpen} title={editing ? "Editar usuario" : "Crear usuario"} onClose={() => setModalOpen(false)}>
        <form onSubmit={onSaveUser}>
          <div className="grid2">
            <div>
              <label className="label" htmlFor="fullName">
                Nombre completo
              </label>
              <input
                id="fullName"
                className="input"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFormErrors(f=>({ ...f, fullName: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.fullName}
                aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
              />
              {formErrors.fullName && <div id="fullName-error" className="fieldError">{formErrors.fullName}</div>}
            </div>

            <div>
              <label className="label" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFormErrors(f=>({ ...f, username: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.username}
                aria-describedby={formErrors.username ? 'username-error' : undefined}
              />
              {formErrors.username && <div id="username-error" className="fieldError">{formErrors.username}</div>}
            </div>

            <div>
              <label className="label" htmlFor="role">
                Rol
              </label>
              <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-required="true">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="sub" style={{ marginTop: 6 }}>
                ADMIN no se crea desde acá.
              </div>
            </div>

            {!editing ? (
              <div>
                <label className="label" htmlFor="password">
                  Contraseña inicial
                </label>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    id="password"
                    className="input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  {formErrors.password && <div id="password-error" className="fieldError">{formErrors.password}</div>}

                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar" : "Mostrar"}
                    style={{ minWidth: 44 }}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>

                <div className="sub" style={{ marginTop: 6 }}>
                  Mínimo 6 caracteres.
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Contraseña</label>
                <div className="sub">Para cambiarla usá “Reset pass”.</div>
              </div>
            )}
          </div>

          <hr className="sep" />

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btnNeutral" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btnPrimary" type="submit">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal open={resetOpen} title="Reset contraseña" onClose={() => setResetOpen(false)}>
        <form onSubmit={onResetPassword}>
          <p className="sub" style={{ marginTop: 0 }}>
            Usuario: <strong>{resetUser?.username}</strong>
          </p>

          <label className="label" htmlFor="newPass">
            Nueva contraseña
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              id="newPass"
              className="input"
              type={showNewPass ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />

            <button
              type="button"
              className="btn"
              onClick={() => setShowNewPass((v) => !v)}
              aria-label={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              title={showNewPass ? "Ocultar" : "Mostrar"}
              style={{ minWidth: 44 }}
            >
              {showNewPass ? "🙈" : "👁"}
            </button>
          </div>

          <div className="sub" style={{ marginTop: 6 }}>
            Mínimo 6 caracteres.
          </div>

          <hr className="sep" />

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btnNeutral" type="button" onClick={() => setResetOpen(false)}>
              Cancelar
            </button>
            <button className="btn btnInfo" type="submit">
              Resetear
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Borrado */}
      <Modal
        open={deleteConfirmOpen}
        title="Confirmar borrado"
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <p className="sub">
          ¿Estás seguro de que querés borrar el usuario <strong>"{deleteTarget?.full_name}"</strong>?
        </p>
        <p className="sub">Esta acción no se puede deshacer.</p>

        <hr className="sep" />

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btnNeutral" type="button" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </button>
          <button className="btn btnDanger" type="button" onClick={onDeleteUser}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
