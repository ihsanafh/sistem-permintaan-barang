import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RequestHistory.css'; // Style untuk halaman riwayat permintaan

function RequestHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/requests/my-requests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRequests(response.data);
      } catch (error) {
        console.error('Gagal mengambil riwayat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) return <p>Memuat riwayat...</p>;

  return (
    <div className="history-container">
      <h3>Riwayat Permintaan Saya</h3>
      <table className="history-table">
        <thead>
          <tr>
            <th>Nama Barang</th>
            <th>Jumlah</th>
            <th>Departemen</th>
            <th>Tanggal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((req) => (
              <tr key={req.request_id}>
                <td>{req.item_name}</td>
                <td>{req.quantity_requested}</td>
                <td>{req.department}</td>
                <td>{new Date(req.request_date).toLocaleDateString('id-ID')}</td>
                <td>
                  <span
                    className={`status status-${req.status
                      .toLowerCase()
                      .replace(/ /g, '-')}`}
                  >
                    {req.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Anda belum pernah membuat permintaan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RequestHistory;
