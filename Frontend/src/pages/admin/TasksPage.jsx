import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import { fetchAdminTasks } from "../../api/adminTasks";
import { fetchUsers } from "../../api/adminUsers";

const STATUSES = [
  { value: "", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "DONE", label: "Hechas" },
];

function isISODate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}


export default function TasksPage() {
  const [toast, setToast] = useState({ type: "ok", message: "" });

  // data
  const [tasks, setTasks] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [operarios, setOperarios] = useState([]);

  // loading
  const [loading, setLoading] = useState(false);

  // filtros
  const [status, setStatus] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [operarioId, setOperarioId] = useState("");
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState("");

  // búsqueda rápida (front)
  const [q, setQ] = useState("");

  async function loadLookups() {
    try {
      const sups = await fetchUsers("SUPERVISOR"); // usa tu /admin/users?role=
      const ops = await fetchUsers("OPERARIO");
      setSupervisores(sups);
      setOperarios(ops);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando usuarios (lookups)" });
    }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (supervisorId) params.supervisorId = supervisorId;
      if (operarioId) params.operarioId = operarioId;
      if (from) params.from = from;
      if (to) params.to = to;

      const list = await fetchAdminTasks(params);
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

  // recargar cuando cambian filtros (sin botón)
  useEffect(() => {
    // validación mínima de fechas
    if (from && !isISODate(from)) return;
    if (to && !isISODate(to)) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, supervisorId, operarioId, from, to]);

  const visibleTasks = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return tasks;

    return tasks.filter((t) => {
      const hay = [
        t.title,
        t.description,
        t.supervisor_name,
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

  const pendingCount = useMemo(
  () => tasks.filter((t) => String(t.status).toUpperCase() === "PENDING").length,
  [tasks]
);

  return (
    <div className="container">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "ok", message: "" })}
      />

      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div>
              <h1 className="h1">Tareas</h1>
              <p className="sub">
                Monitor admin con filtros. Pendientes: <strong>{pendingCount}</strong>
              </p>
            </div>

            <button
              className="btn"
              type="button"
              onClick={() => {
                setStatus("");
                setSupervisorId("");
                setOperarioId("");
                setFrom("");
                setTo("");
                setQ("");
              }}
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>

          <hr className="sep" />

          {/* filtros */}
          <div className="grid2" style={{ alignItems: "end", gap: 12 }}>
            <div>
              <label className="label" htmlFor="q">
                Buscar (título, usuario, servicio)
              </label>
              <input
                id="q"
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: limpieza, Juan, Camino..."
              />
            </div>

            <div>
              <label className="label" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
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
              <label className="label" htmlFor="supervisorId">
                Supervisor
              </label>
              <select
                id="supervisorId"
                className="input"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
              >
                <option value="">Todos</option>
                {supervisores.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="operarioId">
                Operario
              </label>
              <select
                id="operarioId"
                className="input"
                value={operarioId}
                onChange={(e) => setOperarioId(e.target.value)}
              >
                <option value="">Todos</option>
                {operarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="from">
                Desde
              </label>
              <input
                id="from"
                className="input"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                max={to || undefined}
              />
            </div>

            <div>
              <label className="label" htmlFor="to">
                Hasta 
              </label>
              <input
                id="to"
                className="input"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                min={from || undefined}
              />
            </div>
          </div>
        </div>

        <div className="cardBody">
          {loading ? (
            <p className="sub">Cargando...</p>
          ) : visibleTasks.length === 0 ? (
            <p className="sub">No hay tareas para mostrar.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 980, borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Título</th>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Supervisor</th>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Operario</th>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Servicio</th>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Vence</th>
                    <th align="left" style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleTasks.map((t) => {
                    const st = String(t.status || "").toUpperCase();
                    const pending = st === "PENDING";

                    return (
                      <tr key={t.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 900 }}>{t.title}</div>                       
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 800 }}>{t.supervisor_name}</div>
                          <div className="sub">{t.supervisor_username}</div>
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <div style={{ fontWeight: 800 }}>{t.operario_name}</div>
                          <div className="sub">{t.operario_username}</div>
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          {t.service_name ? <span style={{ fontWeight: 800 }}>{t.service_name}</span> : <span className="sub">—</span>}
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontWeight: 800 }}>{t.due_date || "—"}</span>
                        </td>

                        <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>
                          <span
                            style={{
                              fontWeight: 900,
                              color: pending ? "var(--green-700)" : "var(--muted)",
                            }}
                          >
                            {pending ? "Pendiente" : "Completada"}
                          </span>
                          
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="row" style={{ marginTop: 12, justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div className="sub">
              Mostrando: <strong>{visibleTasks.length}</strong> / Total: <strong>{tasks.length}</strong>
            </div>

            <button className="btn btnPrimary" type="button" onClick={loadTasks} title="Refrescar">
              Refrescar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
