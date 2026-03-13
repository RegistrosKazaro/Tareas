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
  const [formErrors, setFormErrors] = useState({
    username: "",
    password: ""
  });

  async function onSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    // Validación simple
    const errs = { username: "", password: "" };

    if (!username.trim()) errs.username = "Usuario requerido";
    if (!password) errs.password = "Contraseña requerida";

    setFormErrors(errs);

    if (errs.username || errs.password) {
      setLoading(false);
      return;
    }

    try {
      console.log("===== LOGIN DEBUG =====");
      console.log("API URL:", import.meta.env.VITE_API_URL);
      console.log("Username:", username);

      const res = await http.post("/auth/login", {
        username,
        password
      });

      console.log("LOGIN RESPONSE:", res.data);

      saveAuth(res.data);

      const role = res.data?.user?.role;

      if (role === "ADMIN") {
        nav("/admin", { replace: true });
      } else if (role === "SUPERVISOR") {
        nav("/supervisor", { replace: true });
      } else {
        nav("/worker", { replace: true });
      }

    } catch (err) {

      console.log("===== LOGIN ERROR =====");
      console.log("FULL ERROR:", err);
      console.log("MESSAGE:", err?.message);
      console.log("CODE:", err?.code);
      console.log("RESPONSE:", err?.response);
      console.log("DATA:", err?.response?.data);

      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Error de conexión con el servidor"
      );

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
              <p className="sub">
                Entrá con tu usuario y contraseña.
              </p>
              <hr className="sep" />
            </div>

            <div className="cardBody">

              <form onSubmit={onSubmit} className="stack" noValidate>

                <div>
                  <label className="label" htmlFor="username">
                    Usuario
                  </label>

                  <input
                    id="username"
                    name="username"
                    className="input"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFormErrors(f => ({ ...f, username: "" }));
                    }}
                    autoComplete="username"
                    required
                  />

                  {formErrors.username &&
                    <div className="fieldError">
                      {formErrors.username}
                    </div>
                  }
                </div>

                <div>
                  <label className="label" htmlFor="password">
                    Contraseña
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormErrors(f => ({ ...f, password: "" }));
                    }}
                    autoComplete="current-password"
                    required
                  />

                  {formErrors.password &&
                    <div className="fieldError">
                      {formErrors.password}
                    </div>
                  }
                </div>

                {error && (
                  <div className="alertDanger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btnPrimary full"
                  disabled={loading || !username.trim() || !password}
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