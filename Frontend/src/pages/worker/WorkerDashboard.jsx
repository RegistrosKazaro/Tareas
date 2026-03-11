import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../../auth/auth";

function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === "."}
      className={({ isActive }) =>
        `btn ${isActive ? "btnPrimary" : ""}`
      }
      style={{ textDecoration: "none" }}
    >
      {children}
    </NavLink>
  );
}

export default function WorkerDashboard() {
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
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <h1 className="h1">Panel Operario</h1>
              <p className="sub">
                Logueado como: <strong>{user?.username}</strong> (OPERARIO)
              </p>
            </div>

            {/* Desktop navigation */}
            <div className="row desktopOnly" style={{ gap: 8, flexWrap: "wrap" }}>
              <Tab to=".">Inicio</Tab>
              <Tab to="tasks">Mis tareas</Tab>
              <button
                className="btn btnWarn"
                type="button"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>

          <hr className="sep" />

          {/* Mobile navigation */}
          <div className="navStack mobileOnly">
            <NavLink
              to="."
              end
              className="btn full"
              style={{ textDecoration: "none" }}
            >
              Inicio
            </NavLink>

            <NavLink
              to="tasks"
              className="btn btnPrimary full"
              style={{ textDecoration: "none" }}
            >
              Mis tareas
            </NavLink>

            <button
              className="btn btnWarn full"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
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