import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { posService } from '../services/posService';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [shiftRecords, setShiftRecords] = useState([]);
  const [debts, setDebts] = useState([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sembako',
    price: '',
    stock: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(posService.getProducts());
    setShiftRecords(posService.getShiftRecords());
    setDebts(posService.getDebts());
  };

  // Stats Calculations
  const totalOmset = shiftRecords.reduce((sum, r) => sum + r.totalSales, 0);
  const totalPiutang = debts
    .filter(d => d.status !== 'Lunas')
    .reduce((sum, d) => sum + (d.amount - (d.amountPaid || 0)), 0);
  const totalKatalog = products.length;

  // Kasir Monitoring
  const kasirPerformance = shiftRecords.reduce((acc, record) => {
    const op = record.operator || 'Unknown';
    if (!acc[op]) {
      acc[op] = { name: op, totalSales: 0, count: 0 };
    }
    acc[op].totalSales += record.totalSales;
    acc[op].count += 1;
    return acc;
  }, {});
  const kasirList = Object.values(kasirPerformance);

  // Form Handlers
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'Sembako',
        price: '',
        stock: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      posService.updateProduct({
        ...editingProduct,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock)
      });
    } else {
      posService.addProduct({
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock)
      });
    }
    loadData();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      posService.deleteProduct(id);
      loadData();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Panel Admin</h1>
        <p className="text-slate-500 mt-1">Dashboard eksekutif dan manajemen toko</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">Total Omset Shift</p>
            <p className="text-2xl font-bold text-emerald-600">Rp {totalOmset.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Total Piutang Aktif</p>
            <p className="text-2xl font-bold text-amber-600">Rp {totalPiutang.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Total Katalog Produk</p>
            <p className="text-2xl font-bold text-blue-600">{totalKatalog} Item</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Management (Takes 2 columns) */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Manajemen Produk</h2>
            <button 
              onClick={() => handleOpenModal()}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Tambah Produk
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-3 font-semibold">Nama Produk</th>
                  <th className="p-3 font-semibold">Kategori</th>
                  <th className="p-3 font-semibold">Harga</th>
                  <th className="p-3 font-semibold text-center">Stok</th>
                  <th className="p-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-800">{p.name}</td>
                    <td className="p-3 text-sm text-slate-600">{p.category}</td>
                    <td className="p-3 font-bold text-emerald-600">Rp {p.price.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{p.stock}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">Tidak ada produk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Kasir Performance */}
        <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-fit">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-bold text-slate-800">Monitoring Performa Kasir</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {kasirList.length === 0 ? (
                <p className="text-center text-slate-500 text-sm">Belum ada data shift kasir.</p>
              ) : (
                kasirList.map((k, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{k.name}</p>
                      <p className="text-xs text-slate-500">{k.count} Shift Terekam</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm">Rp {k.totalSales.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal CRUD Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Produk</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                <select 
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="Sembako">Sembako</option>
                  <option value="Gas">Gas</option>
                  <option value="Galon">Galon</option>
                  <option value="Rokok">Rokok</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Harga (Rp)</label>
                  <input 
                    type="number" required min="0"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Stok Awal</label>
                  <input 
                    type="number" required min="0"
                    value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
