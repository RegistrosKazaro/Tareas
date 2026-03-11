require("dotenv").config();

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
// const { nominaRoutes } = require("./routes/nominaRoutes"); // deprecated: use adminNominaRoutes instead
// const { servicesAdminRoutes } = require("./routes/servicesAdminRoutes"); // deprecated: use adminServicesRoutes instead
const { supervisorNominaRoutes } = require("./routes/supervisorNominaRoutes");


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// DB
const db = initDb();
app.locals.db = db;

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/admin/nomina", adminNominaRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminServicesRoutes);
app.use("/admin", adminTasksRoutes);
app.use("/admin", adminLookupsRoutes);
// app.use("/admin", nominaRoutes); // deprecated: use adminNominaRoutes instead
// app.use("/admin", servicesAdminRoutes); // deprecated: use adminServicesRoutes instead
app.use("/supervisor", supervisorRoutes);
app.use("/supervisor", supervisorServicesRoutes);
app.use("/supervisor", supervisorTasksRoutes);
app.use("/supervisor", supervisorNominaRoutes);
app.use("/worker", workerTasksRoutes);
// Start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
