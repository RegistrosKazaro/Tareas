import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../../auth/auth";

export default function SupervisorDashboard() {
  const nav = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    nav("/login", { replace: true });
  }

  return (
  <div className="page">
    <div className="container stack">
      <div className="card">
        <div className="cardHeader">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <h1 className="h1">Panel Supervisor</h1>
              <p className="sub">
                Logueado como: <strong>{user?.username}</strong> (SUPERVISOR)
              </p>
            </div>

            <button className="btn btnWarn" onClick={logout} type="button">
              Logout
            </button>
          </div>

          <hr className="sep" />

          {/* Desktop: navegación horizontal */}
          <div className="row desktopOnly" style={{ gap: 10, flexWrap: "wrap" }}>
            <NavLink className="btn" to="/supervisor">
              Inicio
            </NavLink>
            <NavLink className="btn btnPrimary" to="/supervisor/tasks">
              Tareas
            </NavLink>
          </div>

          {/* Mobile: navegación en stack */}
          <div className="navStack mobileOnly">
            <NavLink className="btn full" to="/supervisor">
              Inicio
            </NavLink>
            <NavLink className="btn btnPrimary full" to="/supervisor/tasks">
              Tareas
            </NavLink>
          </div>
        </div>

        <div className="cardBody">
          <Outlet />
        </div>
      </div>
    </div>
  </div>
);
}