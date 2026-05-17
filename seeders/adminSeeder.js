'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

async function seed() {
  const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const password    = await bcrypt.hash('admin123', SALT_ROUNDS);

  // INSERT IGNORE agar aman dijalankan berulang kali
  await db.execute(
    'INSERT IGNORE INTO users (name, email, password) VALUES (?, ?, ?)',
    ['Administrator', 'admin@ftiproject.com', password]
  );

  console.log('[Seeder] Admin seeded: admin@ftiproject.com / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seeder] Error:', err.message);
  process.exit(1);
});
