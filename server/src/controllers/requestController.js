const { Pool } = require('pg');
require('dotenv').config();

// Konfigurasi pool database yang lebih robust
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 15000, // Timeout untuk setiap query
  statement_timeout: 15000,
  max: 20,
  allowExitOnIdle: true
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

console.log('Database configured with URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// =========================================================
// CREATE: Karyawan membuat permintaan baru - FIXED VERSION
// =========================================================
exports.createRequest = async (req, res) => {
  console.log('=== CREATE REQUEST STARTED ===');
  console.log('User ID:', req.user?.userId);
  console.log('Department:', req.body?.department);
  console.log('Items:', req.body?.items);

  const { userId } = req.user;
  const { department, items } = req.body;

  // Validasi menyeluruh
  if (!userId) {
    console.error('ERROR: User ID tidak ditemukan di token');
    return res.status(401).json({ 
      success: false, 
      message: 'User tidak terautentikasi' 
    });
  }

  if (!department || !department.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Departemen harus diisi.' 
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Minimal satu barang harus diminta.' 
    });
  }

  // Validasi setiap item
  for (const [index, item] of items.entries()) {
    if (!item.item_id || item.item_id <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Item ${index + 1}: ID barang tidak valid` 
      });
    }
    
    if (!item.quantity_requested || item.quantity_requested <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Item ${index + 1}: Jumlah harus lebih dari 0` 
      });
    }
  }

  const client = await pool.connect();
  
  try {
    console.log('Database connected, starting transaction...');
    
    // Set timeout untuk client ini
    await client.query('SET statement_timeout = 15000');
    await client.query('BEGIN');

    // 1. CHECK ALL ITEMS FIRST (tanpa FOR UPDATE untuk menghindari deadlock)
    const itemChecks = [];
    for (const item of items) {
      console.log(`Checking item ${item.item_id}...`);
      
      const itemResult = await client.query(
        `SELECT item_id, item_name, stock_quantity 
         FROM items 
         WHERE item_id = $1`,
        [item.item_id]
      );

      if (itemResult.rows.length === 0) {
        throw new Error(`Barang dengan ID ${item.item_id} tidak ditemukan`);
      }

      const dbItem = itemResult.rows[0];
      itemChecks.push({
        item_id: dbItem.item_id,
        item_name: dbItem.item_name,
        stock_quantity: dbItem.stock_quantity,
        quantity_requested: item.quantity_requested
      });

      console.log(`Item ${dbItem.item_name} - Stock: ${dbItem.stock_quantity}, Requested: ${item.quantity_requested}`);

      if (dbItem.stock_quantity < item.quantity_requested) {
        throw new Error(`Stok "${dbItem.item_name}" tidak mencukupi. Tersedia: ${dbItem.stock_quantity}, Diminta: ${item.quantity_requested}`);
      }
    }

    // 2. INSERT ALL REQUESTS
    console.log('Inserting requests...');
    for (const item of items) {
      await client.query(
        `INSERT INTO requests (user_id, item_id, quantity_requested, department, status, request_date) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, item.item_id, item.quantity_requested, department.trim(), 'Menunggu Persetujuan Admin']
      );
      console.log(`Request inserted for item ${item.item_id}`);
    }

    await client.query('COMMIT');
    console.log('=== CREATE REQUEST SUCCESS ===');
    
    res.status(201).json({ 
      success: true,
      message: 'Semua permintaan berhasil dikirim.' 
    });

  } catch (err) {
    console.error('=== CREATE REQUEST ERROR ===');
    console.error('Error:', err.message);
    
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr.message);
    }

    // Klasifikasi error yang lebih spesifik
    if (err.message.includes('ECONNREFUSED') || err.message.includes('connection')) {
      res.status(500).json({ 
        success: false,
        message: 'Koneksi database gagal. Silakan coba lagi.' 
      });
    } else if (err.message.includes('timeout')) {
      res.status(500).json({ 
        success: false,
        message: 'Timeout. Silakan coba lagi.' 
      });
    } else if (err.message.includes('stock') || err.message.includes('stok') || err.message.includes('cukup')) {
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
    } else if (err.message.includes('tidak ditemukan')) {
      res.status(404).json({ 
        success: false,
        message: err.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Terjadi kesalahan server: ' + err.message 
      });
    }
  } finally {
    client.release();
    console.log('Database connection released');
  }
};

// =========================================================
// READ: Karyawan melihat riwayat permintaan pribadinya
// =========================================================
exports.getMyRequests = async (req, res) => {
  console.log('=== GET MY REQUESTS ===');
  
  try {
    const { userId } = req.user;
    console.log('Fetching requests for user:', userId);
    
    const result = await pool.query(
      `SELECT r.request_id, r.quantity_requested, r.status, r.department, 
              r.request_date, i.item_name, u.full_name
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = $1
       ORDER BY r.request_date DESC
       LIMIT 50`, // Batasi hasil untuk performa
      [userId]
    );

    console.log(`Found ${result.rows.length} requests for user ${userId}`);
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getMyRequests:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + err.message 
    });
  }
};

// =========================================================
// GET Available Items
// =========================================================
exports.getItems = async (req, res) => {
  try {
    console.log('Fetching available items...');
    const result = await pool.query(
      `SELECT item_id, item_name, stock_quantity 
       FROM items 
       WHERE stock_quantity > 0 
       ORDER BY item_name
       LIMIT 100`
    );

    console.log(`Found ${result.rows.length} available items`);
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getItems:', err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal memuat daftar barang' 
    });
  }
};

// =========================================================
// HEALTH CHECK - Enhanced
// =========================================================
exports.healthCheck = async (req, res) => {
  try {
    // Test database connection dengan timeout
    const dbResult = await Promise.race([
      pool.query('SELECT NOW() as time, version() as version'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    
    res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbResult.rows[0].time,
        version: dbResult.rows[0].version
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: err.message,
      database: { connected: false }
    });
  }
};

module.exports = exports;