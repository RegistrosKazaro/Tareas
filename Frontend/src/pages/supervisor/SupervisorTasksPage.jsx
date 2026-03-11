import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";
import {
  fetchSupervisorTasks,
  createSupervisorTask,
  updateSupervisorTask,
  deleteSupervisorTask,
} from "../../api/supervisorTasks";
import { fetchMyNomina } from "../../api/supervisorNomina";
import { fetchSupervisorServices } from "../../api/supervisorServices";

const STATUSES = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "COMPLETADA", label: "Hechas" },
];

function isISODate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export default function SupervisorTasksPage() {
  const [toast, setToast] = useState({ type: "ok", message: "" });

  // data
  const [tasks, setTasks] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [servicios, setServicios] = useState([]);

  // loading
  const [loading, setLoading] = useState(false);

  // filtros
  const [status, setStatus] = useState("");
  const [operarioId, setOperarioId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // búsqueda rápida
  const [q, setQ] = useState("");

  // modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    operarioId: "",
    title: "",
    description: "",
    dueDate: "",
    serviceId: "",
  });
  const [formErrors, setFormErrors] = useState({ operarioId: "", title: "", dueDate: "", serviceId: "" });

  // Modal confirmación borrado
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadLookups() {
    try {
      const [ops, svcs] = await Promise.all([
        fetchMyNomina(),
        fetchSupervisorServices(),
      ]);
      setOperarios(ops);
      setServicios(svcs.filter((s) => s.assigned_active === 1 && s.service_active === 1));
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando datos" });
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (operarioId) params.operarioId = operarioId;
      if (from && isISODate(from)) params.from = from;
      if (to && isISODate(to)) params.to = to;

      const list = await fetchSupervisorTasks(params);
      setTasks(list);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando tareas" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, operarioId, from, to]);

  const visibleTasks = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return tasks;

    return tasks.filter((t) => {
      const hay = [
        t.title,
        t.description,
        t.operario_name,
        t.service_name,
        t.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [tasks, q]);

  function openCreate() {
    setEditing(null);
    setFormData({
      operarioId: "",
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      serviceId: "",
    });
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setFormData({
      operarioId: task.operario_id,
      title: task.title,
      description: task.description || "",
      dueDate: task.due_date,
      serviceId: task.service_id || "",
    });
    setModalOpen(true);
  }

  async function onSaveTask(e) {
    e.preventDefault();
    // inline validation
    const errs = { operarioId: "", title: "", dueDate: "", serviceId: "" };
    if (!formData.operarioId) errs.operarioId = "Operario requerido";
    if (!formData.title) errs.title = "Título requerido";
    if (!formData.dueDate) errs.dueDate = "Fecha vencimiento requerida";
    if (!formData.serviceId) errs.serviceId = "Servicio requerido";
    setFormErrors(errs);
    if (errs.operarioId || errs.title || errs.dueDate || errs.serviceId) return;

    try {
      const payload = {
        operarioId: formData.operarioId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        serviceId: formData.serviceId,
      };

      if (!editing) {
        await createSupervisorTask(payload);
        setToast({ type: "ok", message: "Tarea creada" });
      } else {
        await updateSupervisorTask(editing.id, payload);
        setToast({ type: "ok", message: "Tarea actualizada" });
      }

      setModalOpen(false);
      await loadTasks();
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error guardando tarea",
      });
    }
  }

  async function onDeleteTask() {
    if (!deleteTarget) return;

    try {
      await deleteSupervisorTask(deleteTarget.id);
      setToast({ type: "ok", message: "Tarea eliminada" });
      setDeleteConfirmOpen(false);
      await loadTasks();
    } catch (e) {
      setToast({
        type: "danger",
        message: e?.response?.data?.error || "Error eliminando tarea",
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
              <h1 className="h1">Mis Tareas</h1>
              <p className="sub">Crear, editar, ver y borrar tus tareas.</p>
            </div>

            <button className="btn btnPrimary" onClick={openCreate} type="button">
              + Nueva tarea
            </button>
          </div>

          <hr className="sep" />
        </div>

        <div className="cardBody">
          {/* Filtros */}
          <div className="toolbar" style={{ marginBottom: 16, gap: 12 }}>
            <div>
              <label className="label" htmlFor="statusFilter">
                Estado
              </label>
              <select
                id="statusFilter"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="operarioFilter">
                Operario
              </label>
              <select
                id="operarioFilter"
                className="input"
                value={operarioId}
                onChange={(e) => setOperarioId(e.target.value)}
              >
                <option value="">Todos</option>
                {operarios.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} ({o.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="fromDate">
                Desde
              </label>
              <input
                id="fromDate"
                className="input"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="toDate">
                Hasta
              </label>
              <input
                id="toDate"
                className="input"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Búsqueda */}
          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="search">
              Buscar
            </label>
            <input
              id="search"
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Título, descripción, operario, servicio..."
              aria-label="Buscar tareas"
            />
          </div>

          <hr className="sep" />

          {/* Tareas */}
          {loading ? (
            <p className="sub">Cargando...</p>
          ) : visibleTasks.length === 0 ? (
            <p className="sub">No hay tareas para mostrar.</p>
          ) : (
            <div role="list" className="compactGrid">
              {visibleTasks.map((task) => {
                const isDone = task.status === "DONE";
                const canEdit = task.status === "PENDING";
                const statusText = isDone ? "COMPLETADA" : "PENDIENTE";

                return (
                  <div
                    role="listitem"
                    key={task.id}
                    className="cardSmall"
                    style={{
                    }}
                  >
                    <div className="row" style={{ justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>
                          {task.title}
                            {isDone && <span aria-hidden="true"> ✅</span>}
                        </div>
                        <div className="sub" style={{ marginTop: 4 }}>
                          {task.description}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 120 }}>
                        <div style={{ fontWeight: 700, color: isDone ? "var(--green-700)" : "var(--warn-600)" }}>
                          {statusText}
                        </div>
                        <div className="sub" style={{ marginTop: 4 }}>
                          {task.due_date}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
                      <span style={{ background: "rgba(22,163,74,0.1)", padding: "4px 8px", borderRadius: 6 }}>
                        Operario: <strong>{task.operario_name}</strong>
                      </span>
                      {task.service_name && (
                        <span style={{ background: "rgba(59,130,246,0.1)", padding: "4px 8px", borderRadius: 6 }}>
                          Servicio: <strong>{task.service_name}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                      {canEdit && (
                        <>
                          <button className="btn btnSecondary" type="button" onClick={() => openEdit(task)}>
                            Editar
                          </button>
                          <button
                            className="btn btnDanger"
                            type="button"
                            onClick={() => {
                              setDeleteTarget(task);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Borrar
                          </button>
                        </>
                      )}
                      {!canEdit && (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          Completada el {task.done_at}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal open={modalOpen} title={editing ? "Editar tarea" : "Nueva tarea"} onClose={() => setModalOpen(false)}>
        <form onSubmit={onSaveTask}>
          <div className="grid2">
            <div>
              <label className="label" htmlFor="opField">
                Operario *
              </label>
              <select
                id="opField"
                className="input"
                value={formData.operarioId}
                onChange={(e) => { setFormData({ ...formData, operarioId: e.target.value }); setFormErrors(f=>({ ...f, operarioId: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.operarioId}
                aria-describedby={formErrors.operarioId ? 'opField-error' : undefined}
              >
                <option value="">Seleccionar...</option>
                {operarios.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name}
                  </option>
                ))}
              </select>
              {formErrors.operarioId && <div id="opField-error" className="fieldError">{formErrors.operarioId}</div>}
            </div>

            <div>
              <label className="label" htmlFor="svcField">
                Servicio *
              </label>
              <select
                id="svcField"
                className="input"
                value={formData.serviceId}
                onChange={(e) => { setFormData({ ...formData, serviceId: e.target.value }); setFormErrors(f=>({ ...f, serviceId: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.serviceId}
                aria-describedby={formErrors.serviceId ? 'svcField-error' : undefined}
              >
                <option value="">Seleccionar...</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {formErrors.serviceId && <div id="svcField-error" className="fieldError">{formErrors.serviceId}</div>}
            </div>

            <div>
              <label className="label" htmlFor="titleField">
                Título *
              </label>
              <input
                id="titleField"
                className="input"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setFormErrors(f=>({ ...f, title: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? 'titleField-error' : undefined}
              />
              {formErrors.title && <div id="titleField-error" className="fieldError">{formErrors.title}</div>}
            </div>

            <div>
              <label className="label" htmlFor="dueDateField">
                Fecha vencimiento *
              </label>
              <input
                id="dueDateField"
                className="input"
                type="date"
                value={formData.dueDate}
                onChange={(e) => { setFormData({ ...formData, dueDate: e.target.value }); setFormErrors(f=>({ ...f, dueDate: "" })); }}
                required
                aria-required="true"
                aria-invalid={!!formErrors.dueDate}
                aria-describedby={formErrors.dueDate ? 'dueDateField-error' : undefined}
              />
              {formErrors.dueDate && <div id="dueDateField-error" className="fieldError">{formErrors.dueDate}</div>}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="label" htmlFor="descField">
              Descripción
            </label>
            <textarea
              id="descField"
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ resize: "vertical" }}
            />
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

      {/* Modal Confirmar Borrado */}
      <Modal
        open={deleteConfirmOpen}
        title="Confirmar borrado"
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <p className="sub">
          ¿Estás seguro de que querés borrar la tarea <strong>"{deleteTarget?.title}"</strong>?
        </p>
        <p className="sub">Esta acción no se puede deshacer.</p>

        <hr className="sep" />

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btnNeutral" type="button" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </button>
          <button className="btn btnDanger" type="button" onClick={onDeleteTask}>
            Borrar
          </button>
        </div>
      </Modal>
    </div>
  );
}