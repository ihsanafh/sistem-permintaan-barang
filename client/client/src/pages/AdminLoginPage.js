import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginForm from '../components/LoginForm';

function AdminLoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/login`,
        { email, password }
      );

      // --- VALIDASI PENTING ---
      // Pastikan hanya admin yang bisa masuk ke halaman ini
      if (response.data.user.role !== 'admin') {
        setError('Akses ditolak. Akun Anda bukan admin.');
        return;
      }

      // Simpan token dan data user di localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Cek apakah ini login pertama
      if (response.data.isFirstLogin) {
        // Arahkan ke halaman ganti password
        navigate('/ganti-password');
      } else {
        // Arahkan ke dashboard admin
        navigate('/admin/dashboard');
      }

    } catch (err) {
      setError(
        err.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.'
      );
    }
  };

  return (
    <LoginForm
      title="Login Admin"
      onLogin={handleLogin}
      error={error}
    />
  );
}

export default AdminLoginPage;
