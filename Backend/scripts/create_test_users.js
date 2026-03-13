const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const db = new Database('src/db/server.db');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

const hash1 = bcrypt.hashSync('test123', 10);
const hash2 = bcrypt.hashSync('test123', 10);

db.prepare('INSERT INTO users(id,role_id,full_name,username,password_hash,active,created_at,updated_at) VALUES(?,2,?,?,?,1,datetime(\'now\'),datetime(\'now\'))').run(uuid(), 'Test User 1', 'testuser1', hash1);
db.prepare('INSERT INTO users(id,role_id,full_name,username,password_hash,active,created_at,updated_at) VALUES(?,3,?,?,?,1,datetime(\'now\'),datetime(\'now\'))').run(uuid(), 'Test User 2', 'testuser2', hash2);

console.log('✅ 2 usuarios creados para prueba (testuser1, testuser2 / pass: test123)');
