import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import Toast from "../../components/Toast";

import {
  fetchServices,
  createService,
  updateService,
  setServiceActive,
  fetchSupervisorServices,
  assignServiceToSupervisor,
  unassignServiceFromSupervisor,
} from "../../api/adminServices";

import { fetchSupervisores } from "../../api/adminNomina";

function isActive(v) {
  return v === 1 || v === true;
}

export default function ServicesPage() {
  const [toast, setToast] = useState({ type: "ok", message: "" });

  // servicios (CRUD)
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // modal crear/editar servicio
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");

  // asignación a supervisores
  const [supervisores, setSupervisores] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // filtros
  const [qServices, setQServices] = useState("");
  const [qAssign, setQAssign] = useState("");

  async function loadServices() {
    setLoadingServices(true);
    try {
      const list = await fetchServices();
      setServices(list);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando servicios" });
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadSupervisores() {
    try {
      const list = await fetchSupervisores();
      setSupervisores(list);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando supervisores" });
    }
  }

  async function loadAssigned(supervisorId) {
    if (!supervisorId) {
      setAssigned([]);
      return;
    }
    setLoadingAssigned(true);
    try {
      const list = await fetchSupervisorServices(supervisorId);
      setAssigned(list);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando asignados" });
    } finally {
      setLoadingAssigned(false);
    }
  }

  useEffect(() => {
    loadServices();
    loadSupervisores();
  }, []);

  useEffect(() => {
    loadAssigned(selectedSupervisorId);
  }, [selectedSupervisorId]);

  const filteredServices = useMemo(() => {
    const q = qServices.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => String(s.name || "").toLowerCase().includes(q));
  }, [services, qServices]);

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.id)), [assigned]);

  const availableForAssign = useMemo(() => {
    const q = qAssign.trim().toLowerCase();
    const base = services.filter((s) => !assignedIds.has(s.id));
    if (!q) return base;
    return base.filter((s) => String(s.name || "").toLowerCase().includes(q));
  }, [services, assignedIds, qAssign]);

  function openCreate() {
    setEditing(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setName(s.name || "");
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    const n = String(name || "").trim();
    if (!n) {
      setToast({ type: "warn", message: "Nombre requerido" });
      return;
    }

    try {
      if (!editing) {
        await createService(n);
        setToast({ type: "ok", message: "Servicio creado" });
      } else {
        await updateService(editing.id, n);
        setToast({ type: "ok", message: "Servicio actualizado" });
      }
      setModalOpen(false);
      await loadServices();
      await loadAssigned(selectedSupervisorId);
    } catch (e2) {
      setToast({ type: "danger", message: e2?.response?.data?.error || "Error guardando servicio" });
    }
  }

  async function toggleServiceActive(s) {
    try {
      const next = !isActive(s.active);
      await setServiceActive(s.id, next);
      setToast({ type: "ok", message: `Servicio ${next ? "activado" : "desactivado"}` });
      await loadServices();
      await loadAssigned(selectedSupervisorId);
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cambiando estado" });
    }
  }

  async function onAssign(serviceId, { silentRefresh = false } = {}) {
    if (!selectedSupervisorId) {
      setToast({ type: "warn", message: "Seleccioná un supervisor" });
      return;
    }
    try {
      await assignServiceToSupervisor(selectedSupervisorId, serviceId);
      if (!silentRefresh) {
        setToast({ type: "ok", message: "Servicio asignado" });
        await loadAssigned(selectedSupervisorId);
      }
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error asignando" });
    }
  }

  async function onUnassign(serviceId, { silentRefresh = false } = {}) {
    if (!selectedSupervisorId) return;
    try {
      await unassignServiceFromSupervisor(selectedSupervisorId, serviceId);
      if (!silentRefresh) {
        setToast({ type: "ok", message: "Servicio quitado" });
        await loadAssigned(selectedSupervisorId);
      }
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error quitando" });
    }
  }

  async function assignAllActive() {
    if (!selectedSupervisorId) {
      setToast({ type: "warn", message: "Seleccioná un supervisor" });
      return;
    }
    const candidates = availableForAssign.filter((s) => isActive(s.active));
    for (const s of candidates) {
      
      await onAssign(s.id, { silentRefresh: true });
    }
    setToast({ type: "ok", message: "Servicios asignados" });
    await loadAssigned(selectedSupervisorId);
  }

  async function unassignAll() {
    if (!selectedSupervisorId) return;
    for (const s of assigned) {
      
      await onUnassign(s.id, { silentRefresh: true });
    }
    setToast({ type: "ok", message: "Servicios quitados" });
    await loadAssigned(selectedSupervisorId);
  }

  return (
    <div className="container">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "ok", message: "" })} />

      <div className="card">
        <div className="cardHeader">
          <div className="row">
            <div>
              <h1 className="h1">Servicios</h1>
              <p className="sub">Crear/editar servicios y asignarlos a supervisores.</p>
            </div>

            <button className="btn btnPrimary" type="button" onClick={openCreate}>
              + Crear servicio
            </button>
          </div>

          <hr className="sep" />
        </div>

        <div className="cardBody">
          <div className="grid2" style={{ alignItems: "start" }}>
            {/* Columna 1: CRUD */}
            <div className="card" style={{ padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label" htmlFor="qServices">
                    Buscar servicio
                  </label>
                  <input
                    id="qServices"
                    className="input"
                    value={qServices}
                    onChange={(e) => setQServices(e.target.value)}
                    placeholder="Ej: Limpieza, Mantenimiento..."
                  />
                </div>
              </div>

              <div className="sub" style={{ marginTop: 10 }}>
                Total: <strong>{filteredServices.length}</strong>
              </div>

              <div style={{ marginTop: 12 }}>
                {loadingServices ? (
                  <p className="sub">Cargando...</p>
                ) : filteredServices.length === 0 ? (
                  <p className="sub">No hay servicios.</p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredServices.map((s) => {
                      const active = isActive(s.active);
                      return (
                        <div
                          key={s.id}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            padding: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ minWidth: 220 }}>
                            <div style={{ fontWeight: 900 }}>{s.name}</div>
                            <div className="sub" style={{ marginTop: 4 }}>
                              Estado:{" "}
                              <strong style={{ color: active ? "var(--green-700)" : "var(--muted)" }}>
                                {active ? "Activo" : "Inactivo"}
                              </strong>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button className="btn" type="button" onClick={() => openEdit(s)}>
                              Editar
                            </button>
                            <button
                              className={`btn ${active ? "btnWarn" : "btnPrimary"}`}
                              type="button"
                              onClick={() => toggleServiceActive(s)}
                            >
                              {active ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Asignación a supervisor */}
            <div className="card" style={{ padding: 14 }}>
              <div>
                <label className="label" htmlFor="supSel">
                  Supervisor
                </label>
                <select
                  id="supSel"
                  className="input"
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {supervisores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="row" style={{ marginTop: 12, gap: 8, justifyContent: "space-between" }}>
                <div className="sub">
                  Asignados: <strong>{assigned.length}</strong>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btnPrimary" type="button" onClick={assignAllActive} disabled={!selectedSupervisorId}>
                    Asignar todos (activos)
                  </button>
                  <button className="btn btnWarn" type="button" onClick={unassignAll} disabled={!selectedSupervisorId || assigned.length === 0}>
                    Quitar todos
                  </button>
                </div>
              </div>

              <hr className="sep" />

              <div className="grid2" style={{ gap: 12 }}>
                {/* Asignados */}
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Servicios asignados</div>
                  {loadingAssigned ? (
                    <p className="sub">Cargando...</p>
                  ) : assigned.length === 0 ? (
                    <p className="sub">No hay asignados.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {assigned.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            padding: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{s.name}</div>
                          <button className="btn btnWarn" type="button" onClick={() => onUnassign(s.id)}>
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Disponibles */}
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Servicios disponibles</div>

                  <label className="label" htmlFor="qAssign">
                    Buscar para asignar
                  </label>
                  <input
                    id="qAssign"
                    className="input"
                    value={qAssign}
                    onChange={(e) => setQAssign(e.target.value)}
                    placeholder="Buscar..."
                  />

                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {availableForAssign.length === 0 ? (
                      <p className="sub">No hay disponibles.</p>
                    ) : (
                      availableForAssign.map((s) => {
                        const active = isActive(s.active);
                        return (
                          <div
                            key={s.id}
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: 14,
                              padding: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              opacity: active ? 1 : 0.55,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800 }}>{s.name}</div>
                              <div className="sub" style={{ marginTop: 4 }}>
                                {active ? "Activo" : "Inactivo"}
                              </div>
                            </div>

                            <button
                              className="btn btnPrimary"
                              type="button"
                              onClick={() => onAssign(s.id)}
                              disabled={!selectedSupervisorId || !active}
                              title={!active ? "Activá el servicio para asignarlo" : "Asignar"}
                            >
                              Asignar
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} title={editing ? "Editar servicio" : "Crear servicio"} onClose={() => setModalOpen(false)}>
        <form onSubmit={onSave}>
          <label className="label" htmlFor="serviceName">
            Nombre del servicio
          </label>
          <input
            id="serviceName"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Mantenimiento, Limpieza..."
          />

          <hr className="sep" />

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btnPrimary" type="submit">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
