const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'espician.sqlite');
const db = new DatabaseSync(dbPath);

try {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;');
  console.log('Added is_admin column');
} catch (e) {
  console.log('is_admin column already exists or skipped:', e.message);
}

db.prepare(`UPDATE users SET is_admin = 1 WHERE username = 'macgagarry' OR email = 'zmacger@gmail.com'`).run();

const users = db.prepare('SELECT id, username, email, is_admin FROM users').all();
console.log('Updated users:', users);
