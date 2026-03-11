import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { saveAuth } from "../auth/auth";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({ username: "", password: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // inline validation
    const errs = { username: "", password: "" };
    if (!username.trim()) errs.username = "Usuario requerido";
    if (!password) errs.password = "Contraseña requerida";
    setFormErrors(errs);
    if (errs.username || errs.password) { setLoading(false); return; }
    try {
      const res = await http.post("/auth/login", { username, password });
      saveAuth(res.data);

      const role = res.data?.user?.role;
      if (role === "ADMIN") nav("/admin", { replace: true });
      else if (role === "SUPERVISOR") nav("/supervisor", { replace: true });
      else nav("/worker", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="loginWrapper">
          <div className="card loginCard loginEnter">
            <div className="cardHeader">
              <h1 className="h1">Ingreso</h1>
              <p className="sub">Entrá con tu usuario y contraseña.</p>
              <hr className="sep" />
            </div>

            <div className="cardBody">
              <form onSubmit={onSubmit} className="stack" noValidate>

                <div>
                  <label className="label" htmlFor="username">
                    Usuario
                  </label>
                  <input
                    data-testid="login-username"
                    id="username"
                    name="username"
                    className="input"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setFormErrors(f=>({ ...f, username: "" })); }}
                    autoComplete="username"
                    required
                    aria-invalid={!!formErrors.username}
                    aria-describedby={formErrors.username ? 'login-username-error' : undefined}
                  />
                  {formErrors.username && <div id="login-username-error" className="fieldError">{formErrors.username}</div>}
                </div>

                <div>
                  <label className="label" htmlFor="password">
                    Contraseña
                  </label>
                  <input
                    data-testid="login-password"
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFormErrors(f=>({ ...f, password: "" })); }}
                    autoComplete="current-password"
                    required
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? 'login-password-error' : undefined}
                  />
                  {formErrors.password && <div id="login-password-error" className="fieldError">{formErrors.password}</div>}
                </div>

                {error && (
                  <div role="alert" className="alertDanger">
                    {error}
                  </div>
                )}

                <button
                  data-testid="login-submit"
                  type="submit"
                  className="btn btnPrimary full"
                  disabled={loading || !username.trim() || !password}
                  aria-busy={loading}
                >
                  {loading ? "Ingresando..." : "Entrar"}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}