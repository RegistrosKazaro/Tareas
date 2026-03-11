import { useEffect, useState } from "react";
import { fetchAdminStats } from "../../api/dashboardStats";

// Si elegís importar acá en vez de main.jsx:
// import "../../styles/ui.base.css";
// import "../../styles/admin.home.css";

export default function AdminHome() {
  const [stats, setStats] = useState({
    users: 0,
    supervisors: 0,
    operarios: 0,
    services: 0,
    taskTotal: 0,
    taskDone: 0,
    taskPending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAdminStats();
        setStats(data);
      } catch (e) {
        console.error("Error loading stats:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completionRate = stats.taskTotal
    ? Math.round((stats.taskDone / stats.taskTotal) * 100)
    : 0;

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <div className="cardHeader">
            <h1 className="h1">Dashboard Admin</h1>
            <p className="sub">Resumen general del sistema.</p>
            <hr className="sep" />
          </div>

          <div className="cardBody">
            {loading ? (
              <p className="sub">Cargando...</p>
            ) : (
              <div className="adminHome">
                {/* Usuarios */}
                <section className="adminSection">
                  <h3 className="adminSectionTitle">👥 Usuarios</h3>
                  <div className="adminGrid">
                    <div className="statCard stat--green">
                      <div className="statValue">{stats.users}</div>
                      <div className="statLabel">Total</div>
                    </div>
                    <div className="statCard stat--blue">
                      <div className="statValue">{stats.supervisors}</div>
                      <div className="statLabel">Supervisores</div>
                    </div>
                    <div className="statCard stat--yellow">
                      <div className="statValue">{stats.operarios}</div>
                      <div className="statLabel">Operarios</div>
                    </div>
                  </div>
                </section>

                <hr className="sep" />

                {/* Servicios */}
                <section className="adminSection">
                  <h3 className="adminSectionTitle">🔧 Servicios</h3>
                  <div className="adminGrid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="statCard stat--purple">
                      <div className="statValue">{stats.services}</div>
                      <div className="statLabel">Servicios activos</div>
                    </div>
                  </div>
                </section>

                <hr className="sep" />

                {/* Tareas */}
                <section className="adminSection">
                  <h3 className="adminSectionTitle">📋 Tareas</h3>
                  <div className="adminGrid">
                    <div className="statCard stat--green">
                      <div className="statValue">{stats.taskTotal}</div>
                      <div className="statLabel">Total</div>
                    </div>
                    <div className="statCard stat--green">
                      <div className="statValue">{stats.taskDone}</div>
                      <div className="statLabel">Completadas</div>
                    </div>
                    <div className="statCard stat--red">
                      <div className="statValue">{stats.taskPending}</div>
                      <div className="statLabel">Pendientes</div>
                    </div>
                  </div>

                  {stats.taskTotal > 0 && (
                    <div className="progressWrap">
                      <div className="sub">
                        Tasa de completación: <strong>{completionRate}%</strong>
                      </div>
                      <div className="progressTrack">
                        <div
                          className="progressBar"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}