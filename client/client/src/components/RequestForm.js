import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Dropdown pencarian barang
import './RequestForm.css';

function RequestForm({ onNewRequest }) {
  const [availableItems, setAvailableItems] = useState([]);
  const [department, setDepartment] = useState('');
  const [rows, setRows] = useState([{ itemId: null, quantity: 1 }]); // Banyak barang
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // ✅ Gunakan environment variable
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/items`);
        const formattedItems = response.data.map(item => ({
          value: item.item_id,
          label: `${item.item_name} (Stok: ${item.stock_quantity})`,
        }));
        setAvailableItems(formattedItems);
      } catch (err) {
        console.error('Gagal memuat daftar barang:', err);
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

    // Siapkan data untuk backend (multi-item)
    const payload = {
      department,
      items: rows.map(row => ({
        item_id: row.itemId ? row.itemId.value : null,
        quantity_requested: parseInt(row.quantity),
      })),
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/requests`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Permintaan berhasil dikirim!');
      setDepartment('');
      setRows([{ itemId: null, quantity: 1 }]); // Reset form
      onNewRequest(); // Update tampilan permintaan
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim permintaan.');
    }
  };

  return (
    <div className="form-container">
      <h3>Buat Permintaan Baru</h3>
      <form onSubmit={handleSubmit} className="request-form">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-row">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input type="text" value={user ? user.fullName : ''} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="department">Ruangan/Departemen</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
        </div>

        <hr />
        <h4>Daftar Barang yang Diminta</h4>

        {rows.map((row, index) => (
          <div className="form-row item-row" key={index}>
            <div className="form-group" style={{ flex: 3 }}>
              <label>Nama Barang</label>
              <Select
                options={availableItems}
                value={row.itemId}
                onChange={(selectedOption) =>
                  handleRowChange(index, 'itemId', selectedOption)
                }
                placeholder="Ketik untuk mencari barang..."
                isClearable
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Jumlah</label>
              <input
                type="number"
                min="1"
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
              >
                Hapus
              </button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={addRow} className="add-row-btn">
            + Tambah Barang
          </button>
          <button type="submit" className="submit-button">
            Kirim Semua Permintaan
          </button>
        </div>
      </form>
    </div>
  );
}

export default RequestForm;
