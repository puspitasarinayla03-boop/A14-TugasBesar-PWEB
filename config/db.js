'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Pool koneksi MySQL menggunakan mysql2/promise.
 * Menggunakan pool agar koneksi dapat di-reuse antar request
 * tanpa overhead membuka/menutup koneksi setiap saat.
 */
const pool = mysql.createPool({
  host              : process.env.DB_HOST     || 'localhost',
  port              : parseInt(process.env.DB_PORT || '3306', 10),
  user              : process.env.DB_USER     || 'root',
  password          : process.env.DB_PASSWORD || '',
  database          : process.env.DB_NAME     || 'fti_project',
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  // Wajib: paksa prepared statement agar aman dari SQL Injection
  namedPlaceholders : false,
});

// Verifikasi koneksi saat server pertama kali jalan
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1); // hentikan server jika DB tidak bisa konek
  }
})();

/**
 * Helper: jalankan query dengan prepared statement.
 * Selalu gunakan fungsi ini — JANGAN string concatenation!
 *
 * @param {string}  sql    - Query SQL dengan placeholder `?`
 * @param {Array}   params - Nilai yang menggantikan placeholder
 * @returns {Promise<Array>} [rows, fields]
 */
async function query(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);
  return [rows, fields];
}

module.exports = { pool, query };
