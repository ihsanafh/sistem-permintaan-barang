import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestForm from '../components/RequestForm';
import RequestHistory from '../components/RequestHistory';
import './DashboardPage.css';

function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    // State ini berfungsi sebagai 'trigger' untuk me-refresh komponen riwayat
    const [requestUpdated, setRequestUpdated] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Fungsi ini akan dipanggil oleh RequestForm setelah request baru berhasil dibuat
    const handleNewRequest = () => {
        setRequestUpdated(!requestUpdated); // Toggle state untuk memicu re-render
    };

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <h2>Selamat Datang, {user ? user.fullName : 'Karyawan'}!</h2>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </header>
            <main className="dashboard-main">
                <RequestForm onNewRequest={handleNewRequest} />
                {/* Kita passing 'key' agar React me-remount komponen ini saat state berubah */}
                <RequestHistory key={requestUpdated} />
            </main>
        </div>
    );
}

export default DashboardPage;