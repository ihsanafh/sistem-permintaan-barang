import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './RequestForm.css';

function RequestForm({ onNewRequest }) {
  const [availableItems, setAvailableItems] = useState([]);
  const [department, setDepartment] = useState('');
  const [rows, setRows] = useState([{ itemId: null, quantity: 1 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user'));

  // Load available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        console.log('Fetching items from API...');
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'https://sistem-permintaan-api.vercel.app'}/api/items`
        );
        
        console.log('Items response:', response.data);
        
        if (response.data.success) {
          const formattedItems = response.data.data.map(item => ({
            value: item.item_id,
            label: `${item.item_name} (Stok: ${item.stock_quantity})`,
            stock: item.stock_quantity
          }));
          setAvailableItems(formattedItems);
          setError('');
        } else {
          throw new Error(response.data.message || 'Gagal memuat data barang');
        }
      } catch (err) {
        console.error('Gagal memuat daftar barang:', err);
        setError('Gagal memuat daftar barang: ' + (err.response?.data?.message || err.message));
      } finally {
        setItemsLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { itemId: null, quantity: 1 }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validasi
    if (!department.trim()) {
      setError('Ruangan/Departemen harus diisi');
      setLoading(false);
      return;
    }

    // Validasi items
    const invalidItems = rows.filter(row => !row.itemId || !row.quantity || row.quantity <= 0);
    if (invalidItems.length > 0) {
      setError('Semua barang harus dipilih dan jumlah harus valid');
      setLoading(false);
      return;
    }

    // Prepare payload
    const payload = {
      department: department.trim(),
      items: rows.map(row => ({
        item_id: parseInt(row.itemId.value),
        quantity_requested: parseInt(row.quantity)
      }))
    };

    console.log('Submitting request:', payload);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'https://sistem-permintaan-api.vercel.app'}/api/requests`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        setSuccess('Permintaan berhasil dikirim!');
        setDepartment('');
        setRows([{ itemId: null, quantity: 1 }]);
        
        if (onNewRequest) {
          onNewRequest();
        }
      } else {
        setError(response.data.message || 'Gagal mengirim permintaan');
      }
    } catch (err) {
      console.error('Submit error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ECONNABORTED') {
        setError('Timeout: Permintaan terlalu lama. Silakan coba lagi.');
      } else {
        setError('Gagal mengirim permintaan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-form-container">
      <h2>Buat Permintaan Baru</h2>
      
      {error && (
        <div className="error-message">
          <strong>Gagal mengirim permintaan.</strong>
          <div>{error}</div>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="request-form">
        {/* Informasi Pengguna */}
        <div className="user-info-section">
          <div className="info-group">
            <label><strong>Nama Lengkap</strong></label>
            <div className="user-value">{user ? user.full_name || user.fullName : 'Budi Hartono'}</div>
          </div>
          
          <div className="info-group">
            <label htmlFor="department"><strong>Ruangan/Departemen</strong></label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Contoh: Hukum, IT, HRD"
              required
              className="department-input"
            />
          </div>
        </div>

        <hr className="divider" />
        
        {/* Daftar Barang */}
        <div className="items-section">
          <h3>Daftar Barang yang Diminta</h3>
          
          {itemsLoading ? (
            <div className="loading-message">Memuat daftar barang...</div>
          ) : (
            <>
              {rows.map((row, index) => (
                <div className="item-row" key={index}>
                  <div className="item-select-group">
                    <label>Nama Barang</label>
                    <Select
                      options={availableItems}
                      value={row.itemId}
                      onChange={(selectedOption) =>
                        handleRowChange(index, 'itemId', selectedOption)
                      }
                      placeholder="Pilih barang..."
                      isClearable
                      isSearchable
                      isLoading={itemsLoading}
                    />
                  </div>

                  <div className="quantity-group">
                    <label>Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        handleRowChange(index, 'quantity', e.target.value)
                      }
                      required
                      className="quantity-input"
                    />
                  </div>

                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="remove-btn"
                      disabled={loading}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={addRow} 
                  className="add-btn"
                  disabled={loading}
                >
                  + Tambah Barang
                </button>
                
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || itemsLoading}
                >
                  {loading ? 'Mengirim...' : 'Kirim Semua Permintaan'}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default RequestForm;