import { useEffect, useRef } from "react";

export default function Modal({ open, title, children, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // focus first focusable element when dialog opens
  useEffect(() => {
    if (open && containerRef.current) {
      const focusable = containerRef.current.querySelector(
        'input,select,textarea,button'
      );
      if (focusable) focusable.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button className="overlay show" onClick={onClose} aria-label="Cerrar modal" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          ref={containerRef}
          className="card"
          style={{
            width: "min(720px, 100%)",
            maxHeight: "85vh",
            overflow: "auto",
            transform: "scale(0.95)",
            animation: "modal-pop 200ms forwards",
          }}
        >
          <div className="cardHeader">
            <div className="row">
              <div>
                <h2 className="h1" style={{ margin: 0 }}>{title}</h2>
                <p className="sub">Completá los datos y guardá.</p>
              </div>
              <button className="btn" onClick={onClose} type="button" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <hr className="sep" />
          </div>

          <div className="cardBody">{children}</div>
        </div>
      </div>
    </>
  );
}
