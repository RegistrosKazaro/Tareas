import { useEffect, useState } from "react";
import { fetchSupervisorStats } from "../../api/dashboardStats";

export default function SupervisorHome() {
  const [stats, setStats] = useState({
    operarios: 0,
    taskTotal: 0,
    taskDone: 0,
    taskPending: 0,
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSupervisorStats();
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
          <h1 className="h1">Dashboard Supervisor</h1>
          <p className="sub">Resumen de tus operarios y tareas.</p>
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
                    background: "rgba(59,130,246,0.1)",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--blue-600)" }}>
                    {stats.operarios}
                  </div>
                  <div className="sub" style={{ marginTop: 4 }}>Operarios asignados</div>
                </div>

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
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>📊 Tasa de completación</h3>
                  <div style={{ marginBottom: 8 }}>
                    <strong>{completionRate}%</strong>
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

              {/* Tareas recientes */}
              {stats.recentTasks && stats.recentTasks.length > 0 && (
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 12 }}>📋 Últimas tareas</h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {stats.recentTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                          <div className="sub" style={{ fontSize: 12 }}>
                            {t.operario_name} • {t.due_date}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: t.status === "DONE" ? "var(--green-600)" : "var(--red-600)",
                          }}
                        >
                          {t.status === "DONE" ? "✓" : "⏳"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}