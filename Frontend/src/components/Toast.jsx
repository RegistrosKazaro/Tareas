export default function Toast({ type = "ok", message, onClose }) {
  if (!message) return null;

  const isDanger = type === "danger";
  const isWarn = type === "warn";

  const bg = isDanger
    ? "rgba(220,38,38,.08)"
    : isWarn
    ? "rgba(217,119,6,.10)"
    : "rgba(22,163,74,.10)";

  const border = isDanger
    ? "rgba(220,38,38,.25)"
    : isWarn
    ? "rgba(217,119,6,.25)"
    : "rgba(22,163,74,.25)";

  const color = isDanger
    ? "var(--danger-600)"
    : isWarn
    ? "var(--warn-600)"
    : "var(--green-700)";

  return (
    <div
      role={isDanger ? "alert" : "status"}
      aria-live={isDanger ? "assertive" : "polite"}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        padding: 12,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        fontWeight: 700,
      }}
    >
      <div style={{ lineHeight: 1.2 }}>{message}</div>
      <button className="btn" onClick={onClose} aria-label="Cerrar alerta" type="button">
        ✕
      </button>
    </div>
  );
}
