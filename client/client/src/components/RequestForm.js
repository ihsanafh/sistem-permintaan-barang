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
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Fetching items from:', `${process.env.REACT_APP_API_URL}/api/items`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/items`);
        
        if (response.data.success) {
          const formattedItems = response.data.data.map(item => ({
            value: item.item_id,
            label: `${item.item_name} (Stok: ${item.stock_quantity})`,
            stock: item.stock_quantity
          }));
          setAvailableItems(formattedItems);
        } else {
          throw new Error(response.data.message || 'Gagal memuat data');
        }
      } catch (err) {
        console.error('Gagal memuat daftar barang:', err);
        setError('Gagal memuat daftar barang: ' + err.message);
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
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validasi frontend
    if (!department.trim()) {
      setError('Departemen harus diisi');
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

    // Siapkan payload
    const payload = {
      department: department.trim(),
      items: rows.map(row => ({
        item_id: parseInt(row.itemId.value),
        quantity_requested: parseInt(row.quantity)
      }))
    };

    console.log('Submitting payload:', payload);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/requests`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
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
      console.error('Request error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Timeout: Permintaan terlalu lama. Silakan coba lagi.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError('Gagal mengirim permintaan: ' + err.message);
      } else {
        setError('Gagal mengirim permintaan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Buat Permintaan Baru</h3>
      
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
        <div className="form-section">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input 
              type="text" 
              value={user ? user.full_name || user.fullName : ''} 
              disabled 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="department">Ruangan/Departemen</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Contoh: Hukum, IT, HRD"
              required
            />
          </div>
        </div>

        <hr />
        
        <h4>Daftar Barang yang Diminta</h4>

        {rows.map((row, index) => (
          <div className="form-row item-row" key={index}>
            <div className="form-group item-select">
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
              />
            </div>

            <div className="form-group quantity-input">
              <label>Jumlah</label>
              <input
                type="number"
                min="1"
                max={row.itemId ? availableItems.find(item => item.value === row.itemId.value)?.stock : undefined}
                value={row.quantity}
                onChange={(e) =>
                  handleRowChange(index, 'quantity', e.target.value)
                }
                required
              />
            </div>

            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="remove-row-btn"
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
            className="add-row-btn"
            disabled={loading}
          >
            + Tambah Barang
          </button>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Mengirim...' : 'Kirim Semua Permintaan'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RequestForm;