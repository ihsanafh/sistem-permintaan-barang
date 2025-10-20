const { Pool } = require('pg');
require('dotenv').config();

// Konfigurasi pool database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 20
});

// =========================================================
// GET Available Items - FIXED
// =========================================================
exports.getItems = async (req, res) => {
  console.log('=== GET ITEMS STARTED ===');
  
  try {
    const result = await pool.query(
      `SELECT item_id, item_name, stock_quantity 
       FROM items 
       WHERE stock_quantity > 0 
       ORDER BY item_name`
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
      message: 'Gagal memuat daftar barang: ' + err.message 
    });
  }
};

// =========================================================
// CREATE: Karyawan membuat permintaan baru
// =========================================================
exports.createRequest = async (req, res) => {
  console.log('=== CREATE REQUEST STARTED ===');
  console.log('User ID:', req.user?.userId);
  console.log('Body:', req.body);

  const { userId } = req.user;
  const { department, items } = req.body;

  // Validasi
  if (!userId) {
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

  const client = await pool.connect();
  
  try {
    console.log('Starting transaction...');
    await client.query('BEGIN');

    // Check semua item tersedia
    for (const item of items) {
      const itemResult = await client.query(
        `SELECT item_name, stock_quantity 
         FROM items 
         WHERE item_id = $1`,
        [item.item_id]
      );

      if (itemResult.rows.length === 0) {
        throw new Error(`Barang dengan ID ${item.item_id} tidak ditemukan`);
      }

      const dbItem = itemResult.rows[0];
      if (dbItem.stock_quantity < item.quantity_requested) {
        throw new Error(`Stok "${dbItem.item_name}" tidak mencukupi. Tersedia: ${dbItem.stock_quantity}, Diminta: ${item.quantity_requested}`);
      }

      // Insert request
      await client.query(
        `INSERT INTO requests (user_id, item_id, quantity_requested, department, status, request_date) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, item.item_id, item.quantity_requested, department.trim(), 'Menunggu Persetujuan Admin']
      );
    }

    await client.query('COMMIT');
    console.log('=== CREATE REQUEST SUCCESS ===');
    
    res.status(201).json({ 
      success: true,
      message: 'Semua permintaan berhasil dikirim.' 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CREATE REQUEST ERROR:', err.message);
    
    if (err.message.includes('stock') || err.message.includes('stok') || err.message.includes('cukup')) {
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
  }
};

// =========================================================
// READ: Karyawan melihat riwayat permintaan pribadinya
// =========================================================
exports.getMyRequests = async (req, res) => {
  console.log('=== GET MY REQUESTS ===');
  
  try {
    const { userId } = req.user;
    const result = await pool.query(
      `SELECT r.request_id, r.quantity_requested, r.status, r.department, 
              r.request_date, i.item_name, u.full_name
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = $1
       ORDER BY r.request_date DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getMyRequests:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// =========================================================
// HEALTH CHECK
// =========================================================
exports.healthCheck = async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as time');
    
    res.status(200).json({
      success: true,
      status: 'OK',
      database: { connected: true },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      error: err.message
    });
  }
};