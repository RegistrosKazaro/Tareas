import { useEffect, useState } from "react";
import { fetchWorkerStats } from "../../api/dashboardStats";

export default function WorkerHome() {
  const [stats, setStats] = useState({
    taskTotal: 0,
    taskDone: 0,
    taskPending: 0,
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchWorkerStats();
        setStats(data);
      } catch (e) {
        console.error("Error loading stats:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completionRate = stats.taskTotal ? Math.round((stats.taskDone / stats.taskTotal) * 100) : 0;

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <h1 className="h1">Dashboard Operario</h1>
          <p className="sub">Resumen de tus tareas y progreso.</p>
          <hr className="sep" />
        </div>

        <div className="cardBody">
          {loading ? (
            <p className="sub">Cargando...</p>
          ) : (
            <div>
              {/* Resumen */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--green-500)" }}>
                    {stats.taskTotal}
                  </div>
                  <div className="sub" style={{ marginTop: 4 }}>Tareas totales</div>
                </div>

                <div
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--green-600)" }}>
                    {stats.taskDone}
                  </div>
                  <div className="sub" style={{ marginTop: 4 }}>Completadas</div>
                </div>

                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--red-600)" }}>
                    {stats.taskPending}
                  </div>
                  <div className="sub" style={{ marginTop: 4 }}>Pendientes</div>
                </div>
              </div>

              <hr className="sep" />

              {/* Progress */}
              {stats.taskTotal > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>📊 Tu progreso</h3>
                  <div style={{ marginBottom: 8 }}>
                    <strong>{completionRate}%</strong> completado
                  </div>
                  <div
                    style={{
                      background: "var(--border)",
                      height: 12,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--green-600)",
                        height: "100%",
                        width: `${completionRate}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <hr className="sep" />

              {/* Tareas próximas */}
              {stats.recentTasks && stats.recentTasks.length > 0 && (
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 12 }}>📋 Tus próximas tareas</h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {stats.recentTasks.map((t) => {
                      const isDone = t.status === "DONE";
                      return (
                        <div
                          key={t.id}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: isDone ? 0.6 : 1,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {t.title}
                              {isDone && " ✅"}
                            </div>
                            <div className="sub" style={{ fontSize: 12 }}>
                              {t.supervisor_name} • {t.due_date}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isDone ? "var(--green-600)" : "var(--red-600)",
                            }}
                          >
                            {isDone ? "✓ Hecha" : "⏳ Por hacer"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stats.taskTotal === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div className="sub">📭 No tenés tareas asignadas aún</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}