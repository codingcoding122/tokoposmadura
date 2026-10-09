import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Users, Calendar, X } from 'lucide-react';
import { posService } from '../services/posService';

const RekapShift = () => {
  const [shiftRecords, setShiftRecords] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Restock Modal States
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductToRestock, setSelectedProductToRestock] = useState(null);
  const [newStockValue, setNewStockValue] = useState(0);

  useEffect(() => {
    setShiftRecords(posService.getShiftRecords());
    setProducts(posService.getProducts());
  }, []);

  const lowStockProducts = products.filter(p => p.stock <= 5);

  const handleRestockClick = (product) => {
    setSelectedProductToRestock(product);
    setNewStockValue(product.stock);
    setIsRestockModalOpen(true);
  };

  const submitRestock = () => {
    if (selectedProductToRestock && newStockValue >= 0) {
      posService.updateStock(selectedProductToRestock.id, Number(newStockValue));
      setProducts(posService.getProducts());
      setIsRestockModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Alert Stok Menipis */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-sm font-bold text-red-800">
                Peringatan: {lowStockProducts.length} Produk dengan Stok Menipis (≤ 5)
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {lowStockProducts.map(product => (
                    <li key={product.id} className="flex justify-between items-center bg-white bg-opacity-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="ml-2 font-bold text-red-600">Sisa {product.stock}</span>
                      </div>
                      <button 
                        onClick={() => handleRestockClick(product)}
                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                      >
                        + Restok
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rekap Shift Section */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Rekap Shift Kasir</h2>
            <p className="text-slate-500 mt-1">Laporan harian penjualan per shift</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors print:hidden"
          >
            Cetak Rekap Shift
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Shift Hari Ini</p>
              <p className="text-2xl font-bold text-slate-800">{shiftRecords.length}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Penjualan</p>
              <p className="text-2xl font-bold text-slate-800">
                Rp {shiftRecords.reduce((sum, r) => sum + r.totalSales, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Piutang Shift</p>
              <p className="text-2xl font-bold text-slate-800">
                Rp {shiftRecords.reduce((sum, r) => sum + r.debt, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold text-sm">Tanggal</th>
                <th className="p-4 font-semibold text-sm">Shift</th>
                <th className="p-4 font-semibold text-sm">Operator</th>
                <th className="p-4 font-semibold text-sm">Total Penjualan</th>
                <th className="p-4 font-semibold text-sm">Tunai</th>
                <th className="p-4 font-semibold text-sm">Utang (Bon)</th>
              </tr>
            </thead>
            <tbody>
              {shiftRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Tidak ada data shift.
                  </td>
                </tr>
              ) : (
                shiftRecords.map(record => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600">
                      {new Date(record.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        record.shift === 'Pagi' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {record.shift}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{record.operator}</td>
                    <td className="p-4 font-bold text-slate-800">
                      Rp {record.totalSales.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      Rp {record.cash.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-emerald-600 font-medium">
                      Rp {record.debt.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Restok */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Restok Produk</h3>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Update stok untuk <span className="font-bold text-slate-800">{selectedProductToRestock?.name}</span>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Stok Baru</label>
                <input 
                  type="number"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={submitRestock}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  Simpan Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RekapShift;
