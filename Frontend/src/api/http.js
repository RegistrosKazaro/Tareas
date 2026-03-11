// src/api/http.js
import axios from "axios";
import { getToken, clearAuth } from "../auth/auth";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
});

// Request interceptor - Agregar token
http.interceptors.request.use((config) => {
  const token = getToken();
  const url = String(config.url || "");
  if (token && !url.startsWith("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - Manejo de errores
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay respuesta (error de red)
    if (!error.response) {
      error.response = {
        status: 0,
        data: {
          error: error.message || "Error de conexión. Verifica que el servidor esté disponible.",
        },
      };
    }

    // Si el token expiró (401)
    if (error.response.status === 401) {
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Si no tiene permisos (403)
    if (error.response.status === 403) {
      error.response.data.error = error.response.data.error || "No tienes permisos para esta acción";
    }

    // Si recurso no existe (404)
    if (error.response.status === 404) {
      error.response.data.error = error.response.data.error || "Recurso no encontrado";
    }

    // Si error del servidor (5xx)
    if (error.response.status >= 500) {
      error.response.data.error = "Error del servidor. Intenta más tarde.";
    }

    return Promise.reject(error);
  }
);