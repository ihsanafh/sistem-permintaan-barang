import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/RequestForm.css';
import '../../components/RequestHistory.css';
import './AdminModal.css'; // CSS untuk modal

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Hukum/Pegawai');
  const [loading, setLoading] = useState(true);

  // State untuk modal edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // === Ambil data pengguna ===
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Gagal mengambil data pengguna:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // === Tambah pengguna baru ===
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/create`,
        { full_name: fullName, email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Akun untuk ${fullName} berhasil dibuat dengan password default '123456'.`);
      setFullName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat akun.');
    }
  };

  // === Buka modal edit ===
  const openEditModal = (user) => {
    setEditingUser({ ...user }); // Salin data user ke state edit
    setIsModalOpen(true);
  };

  // === Tutup modal edit ===
  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // === Update data pengguna ===
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${editingUser.user_id}`,
        {
          full_name: editingUser.full_name,
          email: editingUser.email,
          role: editingUser.role,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Data pengguna berhasil diperbarui.');
      closeEditModal();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui data.');
    }
  };

  return (
    <div>
      <h2>Kelola Akun Pengguna</h2>

      {/* Form untuk membuat user baru */}
      <div className="form-container" style={{ marginBottom: '40px' }}>
        <h3>Buat Akun Baru</h3>
        <form onSubmit={handleAddUser} className="request-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full-name">Nama Lengkap</label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Peran</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Hukum/Pegawai">Hukum/Pegawai</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="submit-button">
            Buat Akun
          </button>
        </form>
      </div>

      {/* Tabel daftar pengguna */}
      <h3>Daftar Pengguna Terdaftar</h3>
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Peran</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    onClick={() => openEditModal(user)}
                    className="action-button approve"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Edit User */}
      {isModalOpen && editingUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Edit Pengguna</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Peran</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="Hukum/Pegawai">Hukum/Pegawai</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="action-button reject"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
