import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../components/LoginForm.css'; // Pakai ulang style dari form login

function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/change-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password berhasil diperbarui! Anda akan diarahkan ke dashboard...');
      setTimeout(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role === 'admin') {
        navigate('/admin/dashboard'); // Arahkan ke dashboard admin
      } else {
        navigate('/dashboard'); // Arahkan ke dashboard biasa
      }
    }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Ganti Password Baru</h2>
        <p>Karena ini adalah login pertama Anda, silakan buat password baru.</p>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-group">
          <label htmlFor="newPassword">Password Baru</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Konfirmasi Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;
