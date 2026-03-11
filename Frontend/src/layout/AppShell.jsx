import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../auth/auth";
import Modal from "../components/Modal";
import { fetchNotifications, markNotificationRead } from "../api/workerTasks";


const NAV = [
  { to: "/admin", label: "Inicio" },
  { to: "/admin/users", label: "Usuarios" },
  { to: "/admin/nomina", label: "Nómina" },
  { to: "/admin/services", label: "Servicios" },
  { to: "/admin/tasks", label: "Tareas" },
];

export default function AppShell({ children, title = "Panel" }) {
  const user = getUser();
  const nav = useNavigate();
  const loc = useLocation();

  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(() => notifications.filter(n => n.read === 0).length, [notifications]);

 useEffect(() => {
  if (window.innerWidth <= 900 && open) setOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loc.pathname]);



  // cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tabs = useMemo(() => NAV, []);

  // listen for global notifications updates from pages
  useEffect(() => {
    function onNotifs(e) {
      if (Array.isArray(e.detail)) {
        setNotifications(e.detail);
      }
    }
    window.addEventListener("notifications", onNotifs);
    return () => window.removeEventListener("notifications", onNotifs);
  }, []);

  // fetch notifications initially and whenever location or user changes
  useEffect(() => {
    if (user?.role === "OPERARIO") {
      fetchNotifications(false).then(setNotifications).catch(console.error);
    }
  }, [loc.pathname, user]);

  // fetch notifications when modal opens (to ensure fresh copy)
  useEffect(() => {
    if (notifOpen && user?.role === "OPERARIO") {
      fetchNotifications(false).then(setNotifications).catch(console.error);
    }
  }, [notifOpen, user]);

  async function markAllRead() {
    const unread = notifications.filter(n => n.read === 0);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
    const fresh = await fetchNotifications(false);
    setNotifications(fresh);
  }

  return (
    <div className="shell">
      {/* Overlay mobile */}
      {open && <button className="overlay" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Menú principal">
        <div className="sideTop">
          <div>
            <div className="brand">AppTareas</div>
            <div className="brandSub">{user?.username} ({user?.role})</div>
          </div>

          <button
            className="btn mobileOnly"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            title="Cerrar menú"
            type="button"
            >
            ✕
        </button>

        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sideBottom">
          <button
            className="btn btnWarn"
            onClick={() => {
              clearAuth();
              nav("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="main" role="main">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn burger"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            title="Abrir menú"
          >
            ☰
          </button>

          <div className="topTitle">
            <div className="hTop">{title}</div>
            <div className="sub">Gestioná usuarios, nómina, servicios y tareas</div>
          </div>

          <div className="spacer" />

          {/* notifications button */}
          {user?.role === "OPERARIO" && (
            <button
              className="btn"
              onClick={() => setNotifOpen(true)}
              aria-label="Ver notificaciones"
              title="Notificaciones"
              style={{ position: "relative" }}
            >
              🔔
              {unreadCount > 0 && <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>{unreadCount}</span>}
            </button>
          )}

          {/* Tabs desktop */}
          <div className="tabs" role="tablist" aria-label="Secciones">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) => `tab ${isActive ? "tabActive" : ""}`}
                  role="tab"
                  aria-selected={loc.pathname === t.to}
                  aria-current={loc.pathname === t.to ? 'page' : undefined}
              >
                {t.label}
              </NavLink>
            ))}
          </div>

          {/* logout botón topbar - visible solo en desktop (oculto en mobile) */}
          <button
            className="btn btnWarn desktopOnly logout btn-sm"
            onClick={() => {
              clearAuth();
              nav("/login", { replace: true });
            }}
            title="Logout"
          >
            Logout
          </button>
        </header>

        <div className="content">{children}</div>

        {/* Notification history modal */}
        <Modal open={notifOpen} title="Notificaciones" onClose={() => setNotifOpen(false)}>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p className="sub">No hay notificaciones.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {notifications.map((n) => (
                  <li key={n.id} style={{ padding: 8, background: n.read ? "transparent" : "rgba(255,235,59,0.2)", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{n.message}</span>
                      {!n.read && (
                        <button
                          className="btn btnSm"
                          onClick={async () => {
                            await markNotificationRead(n.id);
                            const fresh = await fetchNotifications(false);
                            setNotifications(fresh);
                          }}
                          style={{ fontSize: 12 }}
                        >Marcar leído</button>
                      )}
                    </div>
                    <div className="sub" style={{ fontSize: 11, marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <hr className="sep" />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btnNeutral" type="button" onClick={() => setNotifOpen(false)}>
              Cerrar
            </button>
            {unreadCount > 0 && (
              <button className="btn btnPrimary" type="button" onClick={markAllRead}>
                Marcar todas leídas
              </button>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}
