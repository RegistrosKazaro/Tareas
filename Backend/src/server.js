require("dotenv").config();

const requiredEnv = ["JWT_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key] || !String(process.env[key]).trim()) {
    console.error(`Falta la variable de entorno obligatoria: ${key}`);
    process.exit(1);
  }
}

const express = require("express");
const cors = require("cors");

const { initDb } = require("./db/db");
const { authRoutes } = require("./routes/authRoutes");
const { adminRoutes } = require("./routes/adminRoutes");
const { supervisorRoutes } = require("./routes/supervisorRoutes");
const { adminNominaRoutes } = require("./routes/adminNominaRoutes");
const { supervisorServicesRoutes } = require("./routes/supervisorServicesRoutes");
const { supervisorTasksRoutes } = require("./routes/supervisorTasksRoutes");
const { workerTasksRoutes } = require("./routes/workerTasksRoutes");
const { adminTasksRoutes } = require("./routes/adminTasksRoutes");
const { adminLookupsRoutes } = require("./routes/adminLookupsRoutes");
const { adminServicesRoutes } = require("./routes/adminServicesRoutes");
const { supervisorNominaRoutes } = require("./routes/supervisorNominaRoutes");

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// DB
const db = initDb();
app.locals.db = db;

// Health
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/admin/nomina", adminNominaRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminServicesRoutes);
app.use("/admin", adminTasksRoutes);
app.use("/admin", adminLookupsRoutes);
app.use("/supervisor", supervisorRoutes);
app.use("/supervisor", supervisorServicesRoutes);
app.use("/supervisor", supervisorTasksRoutes);
app.use("/supervisor", supervisorNominaRoutes);
app.use("/worker", workerTasksRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// Start
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});