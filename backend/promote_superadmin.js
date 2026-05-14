/**
 * One-time helper script to promote a user to superadmin.
 * Usage: node promote_superadmin.js your@email.com
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node promote_superadmin.js <email>');
  process.exit(1);
}

const DB_PATH = path.join(__dirname, 'lms.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Could not open lms.db:', err.message);
    process.exit(1);
  }
});

db.get('SELECT id, name, email, role FROM users WHERE email = ?', [email], (err, row) => {
  if (err) { console.error(err.message); process.exit(1); }
  if (!row) {
    console.error(`No user found with email: ${email}`);
    console.error('Make sure you have registered first at http://localhost:5173/register');
    db.close();
    process.exit(1);
  }

  console.log(`Found user: ${row.name} (${row.email}) — current role: ${row.role}`);

  db.run('UPDATE users SET role = ? WHERE email = ?', ['superadmin', email], function(err) {
    if (err) { console.error('Update failed:', err.message); process.exit(1); }

    console.log('');
    console.log('✅  Success! ' + row.name + ' is now SUPERADMIN.');
    console.log('   Log out and log back in to activate the new role.');
    db.close();
  });
});
