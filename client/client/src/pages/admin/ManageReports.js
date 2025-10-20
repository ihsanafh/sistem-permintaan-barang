import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import '../../components/RequestHistory.css';
import '../../components/RequestForm.css';

function ManageReports() {
    const [requests, setRequests] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetchReport = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/reports/generate`,
                { startDate, endDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRequests(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data laporan.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToPDF = () => {
        if (requests.length === 0) {
            alert("Tidak ada data untuk diekspor. Silakan tampilkan laporan terlebih dahulu.");
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFont('Arial', 'normal');
        doc.setFontSize(12);

        // Judul dokumen
        doc.setFontSize(16);
        doc.text('Laporan Permintaan Barang', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Periode: ${startDate} s/d ${endDate}`, 105, 28, { align: 'center' });

        // Siapkan data tabel
        const tableColumn = [
            "No.",
            "Tanggal Selesai",
            "Nama Barang",
            "Jumlah",
            "Nama Penerima",
            "Ruangan/Departemen",
            "TTD"
        ];
        const tableRows = requests.map((req, index) => [
            index + 1,
            new Date(req.processed_date).toLocaleDateString('id-ID'),
            req.item_name,
            req.quantity_requested,
            req.full_name,
            req.department,
            ''
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: {
                font: 'Arial',
                fontSize: 12,
                halign: 'left',
                valign: 'middle',
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [230, 230, 230],
                textColor: 0,
                fontStyle: 'bold',
                halign: 'center',
                lineColor: [0, 0, 0],
                lineWidth: 0.2,
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                3: { halign: 'center', cellWidth: 20 },
                6: { halign: 'center', cellWidth: 20 },
            },
        });

        doc.save(`Laporan_Permintaan_${startDate}_sampai_${endDate}.pdf`);
    };

    return (
        <div>
            <h2>Rekap Data Laporan</h2>
            <p>Pilih rentang tanggal untuk melihat data permintaan yang telah diselesaikan.</p>

            <div className="form-container" style={{ maxWidth: '700px', marginBottom: '30px' }}>
                <form onSubmit={handleFetchReport} className="request-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="start-date">Dari Tanggal</label>
                            <input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="end-date">Sampai Tanggal</label>
                            <input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                        </button>
                        <button
                            type="button"
                            onClick={handleExportToPDF}
                            className="pdf-button"
                            disabled={requests.length === 0}
                        >
                            Export ke PDF
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>

            <table className="history-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Tanggal Selesai</th>
                        <th>Nama Barang</th>
                        <th>Jumlah</th>
                        <th>Nama Penerima</th>
                        <th>Ruangan/Departemen</th>
                        <th>TTD</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length > 0 ? (
                        requests.map((req, index) => (
                            <tr key={index}>
                                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                <td>{new Date(req.processed_date).toLocaleDateString('id-ID')}</td>
                                <td>{req.item_name}</td>
                                <td style={{ textAlign: 'center' }}>{req.quantity_requested}</td>
                                <td>{req.full_name}</td>
                                <td>{req.department}</td>
                                <td></td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">Tidak ada data untuk periode yang dipilih.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ManageReports;
