const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");

const DB_FILE = path.join(__dirname, "server.db");
const SQL_DIR = path.join(__dirname, "sql");


// Helpers
function readSql(filename) {
  const fullPath = path.join(SQL_DIR, filename);
  return fs.readFileSync(fullPath, "utf-8");
}

function uuid() {
  try {
    const crypto = require("crypto");
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch (_) {}

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function openDb() {
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function runSqlFile(db, filename) {
  const sql = readSql(filename);
  try {
    db.transaction(() => db.exec(sql))();
  } catch (err) {
    console.error("\n❌ ERROR ejecutando SQL:", filename);
    console.error("---- SQL (primeras 300 chars) ----");
    console.error(sql.slice(0, 300));
    console.error("----------------------------------\n");
    throw err;
  }
}


// Admin inicial

function seedAdminUser(db) {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
  const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador General";

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ? LIMIT 1")
    .get(ADMIN_USERNAME);

  if (existing) return;

  const adminId = uuid();
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  db.prepare(`
    INSERT INTO users (
      id, role_id, full_name, username, password_hash,
      active, created_at, updated_at
    )
    VALUES (?, 1, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `).run(adminId, ADMIN_NAME, ADMIN_USERNAME, hash);

  console.log("✔ Admin inicial creado:");
  console.log(`   username: ${ADMIN_USERNAME}`);
  console.log(`   password: ${ADMIN_PASSWORD}`);
}

// Init DB
function initDb() {
  if (!fs.existsSync(SQL_DIR)) {
    throw new Error(`No existe la carpeta SQL: ${SQL_DIR}`);
  }

  const db = openDb();

  runSqlFile(db, "001_tables.sql");
  runSqlFile(db, "002_seed.sql");
  runSqlFile(db, "003_indexes.sql");
  runSqlFile(db, "004_services.sql");
  runSqlFile(db, "005_worker_services.sql");
  runSqlFile(db, "006_tasks.sql");
  runSqlFile(db, "008_notifications.sql");



  seedAdminUser(db);

  return db;
}

module.exports = { initDb };
