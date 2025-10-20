const { Pool } = require('pg');
require('dotenv').config();

// Kode ini akan mencari variabel DATABASE_URL dari Vercel,
// atau menggunakan variabel .env jika dijalankan lokal.
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: connectionString,
  // Baris ini wajib untuk koneksi ke Supabase/Render dari Vercel
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
