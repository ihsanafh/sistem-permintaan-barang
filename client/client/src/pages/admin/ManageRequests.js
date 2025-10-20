import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/RequestHistory.css';

function ManageRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(response.data);
    } catch (err) {
      setError('Gagal memuat data permintaan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcessRequest = async (requestId, action) => {
    if (
      !window.confirm(
        `Anda yakin ingin ${
          action === 'Selesai' ? 'menyetujui' : 'menolak'
        } permintaan ini?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/requests/${requestId}/process`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh daftar permintaan setelah berhasil
      fetchRequests();
    } catch (err) {
      alert('Gagal memproses permintaan.');
      console.error(err);
    }
  };

  if (loading) return <p>Memuat data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Kelola Permintaan Masuk</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Nama Karyawan</th>
            <th>Nama Barang</th>
            <th>Jumlah</th>
            <th>Tanggal</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.request_id}>
              <td>{req.full_name}</td>
              <td>{req.item_name}</td>
              <td>{req.quantity_requested}</td>
              <td>{new Date(req.request_date).toLocaleString('id-ID')}</td>
              <td>
                <span
                  className={`status status-${req.status
                    .toLowerCase()
                    .replace(/ /g, '-')}`}
                >
                  {req.status}
                </span>
              </td>
              <td>
                {req.status === 'Menunggu Persetujuan Admin' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() =>
                        handleProcessRequest(req.request_id, 'Selesai')
                      }
                      className="action-button approve"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() =>
                        handleProcessRequest(req.request_id, 'Ditolak')
                      }
                      className="action-button reject"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageRequests;
