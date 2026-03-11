import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/00_tokens.css";
import "./styles/01_shell_layout.css";
import "./styles/02_components.css";
import "./styles/04_pages_common.css";
import "./styles/03_pages_admin.css"; 
import "./styles.css"; // <- tu diseño real (verde + responsive)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);