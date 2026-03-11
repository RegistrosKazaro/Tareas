import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/Toast";
import {
  fetchSupervisores,
  fetchOperarios,
  fetchOperariosDeSupervisor,
  assignOperario,
  unassignOperario,
} from "../../api/adminNomina";

function isActive(v) {
  return v === 1 || v === true;
}

export default function NominaPage() {
  const [toast, setToast] = useState({ type: "ok", message: "" });

  const [loading, setLoading] = useState(false);
  const [supervisores, setSupervisores] = useState([]);
  const [operarios, setOperarios] = useState([]);

  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [assigned, setAssigned] = useState([]); // operarios asignados al supervisor

  const [q, setQ] = useState("");

  async function loadBase() {
    setLoading(true);
    try {
      const [sups, ops] = await Promise.all([fetchSupervisores(), fetchOperarios()]);
      setSupervisores(sups);
      setOperarios(ops);

      // seleccionar primero automáticamente
      if (!selectedSupervisorId && sups.length > 0) {
        setSelectedSupervisorId(sups[0].id);
      }
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando nómina" });
    } finally {
      setLoading(false);
    }
  }

  async function loadAssigned(supervisorId) {
    if (!supervisorId) return;
    try {
      const list = await fetchOperariosDeSupervisor(supervisorId);
      // tomamos solo activos del vínculo
      setAssigned(list.filter((x) => x.in_nomina === 1 || x.in_nomina === true));
    } catch (e) {
      setToast({ type: "danger", message: e?.response?.data?.error || "Error cargando asignados" });
    }
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  loadAssigned(selectedSupervisorId);
  
}, [selectedSupervisorId]);


  const assignedIds = useMemo(() => new Set(assigned.map((o) => o.id)), [assigned]);

  const filteredOperarios = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = operarios.filter((o) => {
      if (!term) return true;
      return (
        String(o.full_name || "").toLowerCase().includes(term) ||
        String(o.username || "").toLowerCase().includes(term)
      );
    });

    // primero los no asignados
    return list.sort((a, b) => {
      const aa = assignedIds.has(a.id) ? 1 : 0;
      const bb = assignedIds.has(b.id) ? 1 : 0;
      if (aa !== bb) return aa - bb;
      return String(a.full_name || "").localeCompare(String(b.full_name || ""));
    });
  }, [operarios, q, assignedIds]);

 async function onAssign(opId, { silentRefresh = false } = {}) {
  if (!selectedSupervisorId) return;

  try {
    await assignOperario(selectedSupervisorId, opId);

    if (!silentRefresh) {
      setToast({ type: "ok", message: "Operario asignado" });
      await loadAssigned(selectedSupervisorId);
    }
  } catch (e) {
    setToast({
      type: "danger",
      message: e?.response?.data?.error || "Error asignando operario",
    });
  }
}

 async function onUnassign(opId, { silentRefresh = false } = {}) {
  if (!selectedSupervisorId) return;

  try {
    await unassignOperario(selectedSupervisorId, opId);

    if (!silentRefresh) {
      setToast({ type: "ok", message: "Operario quitado" });
      await loadAssigned(selectedSupervisorId);
    }
  } catch (e) {
    setToast({
      type: "danger",
      message: e?.response?.data?.error || "Error quitando operario",
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
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div>
              <h1 className="h1">Nómina</h1>
              <p className="sub">Asigná operarios a un supervisor.</p>
            </div>

            <div className="row" style={{ gap: 12 }}>
              <div style={{ minWidth: 260 }}>
                <label className="label" htmlFor="sup">
                  Supervisor
                </label>
                <select
                  id="sup"
                  className="input"
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                >
                  {supervisores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.username}){isActive(s.active) ? "" : " - INACTIVO"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 260 }}>
                <label className="label" htmlFor="q">
                  Buscar operario
                </label>
                <input
                  id="q"
                  className="input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="nombre o usuario…"
                />
              </div>
            </div>
          </div>

          <hr className="sep" />
        </div>

        <div className="cardBody">
          {loading ? (
            <p className="sub">Cargando…</p>
          ) : !selectedSupervisorId ? (
            <p className="sub">Creá un supervisor primero.</p>
          ) : (
            <div className="grid2" style={{ gap: 16 }}>
              {/* Asignados */}
              <div className="card" style={{ margin: 0 }}>
                <div className="cardHeader">
                  <h2 className="h2" style={{ margin: 0 }}>
                    Operarios asignados
                  </h2>
                  <p className="sub" style={{ marginTop: 6 }}>
                    Total: <strong>{assigned.length}</strong>
                  </p>
                  <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <button
                    className="btn btnWarn"
                    type="button"
                    onClick={async () => {
                    if (!selectedSupervisorId) return;
                    // quitar todos los asignados
                    for (const o of assigned) {
                    await onUnassign(o.id, { silentRefresh: true });
                    }

                    setToast({ type: "ok", message: "Operarios quitados" });
                    await loadAssigned(selectedSupervisorId);

                    }}
                    disabled={assigned.length === 0}
                >
                    Quitar todos
                </button>
                </div>

                </div>

                <div className="cardBody">
                  {assigned.length === 0 ? (
                    <p className="sub">Todavía no hay operarios asignados.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {assigned.map((o) => (
                        <div
                          key={o.id}
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
                          <div>
                            <div style={{ fontWeight: 800 }}>{o.full_name}</div>
                            <div className="sub">{o.username}</div>
                          </div>
                          <button className="btn btnWarn" type="button" onClick={() => onUnassign(o.id)}>
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Todos */}
              <div className="card" style={{ margin: 0 }}>
                <div className="cardHeader">
                  <h2 className="h2" style={{ margin: 0 }}>
                    Todos los operarios
                  </h2>
                  <p className="sub" style={{ marginTop: 6 }}>
                    Tip: buscá y asigná con 1 click.
                  </p>
                    <div className="row" style={{ gap: 8, marginTop: 10 }}>
                    <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={async () => {
                        if (!selectedSupervisorId) return;

                        // asignar todos los que NO estén asignados y estén activos
                         const candidates = filteredOperarios.filter(
                            (o) => !assignedIds.has(o.id) && isActive(o.active)
                        );

                        for (const o of candidates) {
                        await onAssign(o.id, { silentRefresh: true });
                        }

                        setToast({ type: "ok", message: "Operarios asignados" });
                        await loadAssigned(selectedSupervisorId);

                        }}
                        disabled={filteredOperarios.filter((o) => !assignedIds.has(o.id) && isActive(o.active)).length === 0}
                    >
                        Asignar todos (activos)
                    </button>
                    </div>

                </div>

                <div className="cardBody">
                  {filteredOperarios.length === 0 ? (
                    <p className="sub">No hay operarios para mostrar.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredOperarios.map((o) => {
                        const already = assignedIds.has(o.id);
                        const inactive = !isActive(o.active);
                        return (
                          <div
                            key={o.id}
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: 14,
                              padding: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              opacity: inactive ? 0.6 : 1,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800 }}>
                                {o.full_name} {inactive ? "(INACTIVO)" : ""}
                              </div>
                              <div className="sub">{o.username}</div>
                            </div>

                            {already ? (
                              <button className="btn" type="button" disabled>
                                Asignado
                              </button>
                            ) : (
                              <button
                                className="btn btnPrimary"
                                type="button"
                                onClick={() => onAssign(o.id)}
                                disabled={inactive}
                              >
                                Asignar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
