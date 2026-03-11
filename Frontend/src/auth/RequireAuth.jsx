// src/auth/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getUser, isLoggedIn } from "./auth";

export default function RequireAuth({ roles = [], children }) {
  const loc = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}