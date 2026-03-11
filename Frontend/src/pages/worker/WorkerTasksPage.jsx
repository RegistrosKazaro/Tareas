import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { fetchMyTasks, markTaskDone, fetchNotifications } from "../../api/workerTasks";

export default function WorkerTasksPage() {
  const [toast, setToast] = useState({ type: "ok", message: "" });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("PENDING");

  async function load() {
    setLoading(true);
    try {
      const list = await fetchMyTasks({ status: status || undefined });
      setTasks(list);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando tareas" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await load();
      try {
        // get notifications without marking read yet
        const nots = await fetchNotifications(false);
        window.dispatchEvent(new CustomEvent('notifications', { detail: nots }));
        const unread = nots.filter((n) => n.read === 0);
        if (unread.length > 0) {
          const latestNotif = unread[0];
          setToast({ type: "info", message: latestNotif.message });
          // after showing toast, mark them read so we don't repeat
          await fetchNotifications(true);
          // update global state as well
          const updated = await fetchNotifications(false);
          window.dispatchEvent(new CustomEvent('notifications', { detail: updated }));
        }
      } catch (e) {
        console.error("Error cargando notificaciones:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function onDone(id) {
    try {
      await markTaskDone(id);
      setToast({ type: "ok", message: "Tarea marcada como completa" });
      await load();
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error marcando tarea" });
    }
  }

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "ok", message: "" })} />

      <div className="toolbar">
        <div>
          <h2 style={{ marginTop: 0 }}>Mis tareas</h2>
          <p className="sub">Solo ves tus tareas cuando estan marcadas como completadas.</p>
        </div>

        <div style={{ minWidth: 220 }}>
          <label className="label" htmlFor="status">Estado</label>
          <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Pendientes</option>
            <option value="DONE">Realizadas</option>
            <option value="">Todas</option>
          </select>
        </div>
      </div>

      <hr className="sep" />

      {loading ? (
        <p className="sub">Cargando...</p>
      ) : tasks.length === 0 ? (
        <p className="sub">No hay tareas.</p>
      ) : (
        <div role="list" className="compactGrid">
          {tasks.map((t) => {
            const done = t.status === "DONE";
            return (
              <div
                role="listitem"
                key={t.id}
                className="cardSmall"
                style={{
                  display: "grid",
                  gap: 6,
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>
                    {t.title}
                    {done && <span aria-hidden="true"> ✅</span>}
                  </div>
                  <div style={{ fontWeight: 900, color: done ? "var(--green-700)" : "var(--muted)" }}>
                    {done ? "COMPLETADA" : "PENDIENTE"}
                  </div>
                </div>

                {t.description && <div className="sub">{t.description}</div>}

                <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div className="sub">
                    Supervisor: <strong>{t.supervisor_name}</strong> ({t.supervisor_username})
                  </div>
                  {t.service_name ? (
                    <div className="sub">
                      Servicio: <strong>{t.service_name}</strong>
                    </div>
                  ) : null}
                  <div className="sub">
                    Vence: <strong>{t.due_date}</strong>
                  </div>
                </div>

                {!done ? (
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn btnPrimary" type="button" onClick={() => onDone(t.id)}>
                      Marcar completada
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}