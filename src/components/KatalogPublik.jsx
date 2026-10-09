import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Send, User, MapPin } from 'lucide-react';
import { posService } from '../services/posService';

const KatalogPublik = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [addressNote, setAddressNote] = useState('');

  useEffect(() => {
    // Muat produk dari posService
    setProducts(posService.getProducts());
  }, []);

  const baseCategories = ['Semua', 'Sembako', 'Gas', 'Galon', 'Rokok'];
  const categories = [...new Set([...baseCategories, ...products.map(p => p.category)])];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleKirimWhatsApp = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }
    if (!customerName.trim()) {
      alert("Mohon isi Nama Pemesan!");
      return;
    }

    const nomorWA = "6281234567890"; // Ganti dengan nomor WA toko yang sebenarnya
    let pesan = `*PESANAN BARU DARI TOKO MADURA*%0A%0A`;
    pesan += `*Nama Pemesan:* ${customerName}%0A`;
    if (addressNote) {
      pesan += `*Alamat/Catatan:* ${addressNote}%0A`;
    }
    pesan += `%0A*Detail Pesanan:*%0A`;
    
    cart.forEach((item, index) => {
      pesan += `${index + 1}. ${item.name} - ${item.qty}x (Rp ${(item.price * item.qty).toLocaleString('id-ID')})%0A`;
    });
    
    pesan += `%0A*Total Belanja:* Rp ${total.toLocaleString('id-ID')}%0A`;
    pesan += `%0AMohon segera diproses ya, terima kasih!`;

    window.open(`https://wa.me/${nomorWA}?text=${pesan}`, '_blank');
  };

  return (
    <div className="flex h-full gap-6 bg-slate-100 font-sans">
      {/* Kiri: Daftar Produk (Katalog Publik) */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-900 text-white">
          <h1 className="text-2xl font-bold text-emerald-400 mb-4">Katalog Toko Madura</h1>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk yang ingin dibeli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-emerald-500 hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-4 flex-1">
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-100 inline-block px-2 py-1 rounded mb-2">
                    {product.category}
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem] mb-1">
                    {product.name}
                  </h3>
                  <p className="font-bold text-emerald-600 text-lg mt-2">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs mt-1 ${product.stock <= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                    Tersedia: {product.stock}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <Search size={48} className="mb-4 text-slate-300" />
              <p>Maaf, produk tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Kanan: Keranjang Publik */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-emerald-500 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Keranjang Saya
          </h2>
          <span className="bg-white text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart size={48} className="mb-4 text-slate-200" />
              <p>Keranjang belanja masih kosong</p>
              <p className="text-sm mt-2">Silakan pilih produk di katalog</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800 text-sm leading-tight mb-1">{item.name}</h4>
                    <p className="text-emerald-600 font-bold text-sm">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 justify-between">
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Total Estimasi</span>
            <span className="text-2xl font-bold text-slate-900">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Nama Pemesan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Alamat / Catatan Pengiriman
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                <textarea
                  placeholder="Contoh: Jl. Sudirman No 10 (Titip di pos satpam)"
                  value={addressNote}
                  onChange={(e) => setAddressNote(e.target.value)}
                  rows="2"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleKirimWhatsApp}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              cart.length === 0 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-emerald-500/30'
            }`}
          >
            <Send size={18} />
            KIRIM PESANAN VIA WA
          </button>
        </div>
      </div>
    </div>
  );
};

export default KatalogPublik;
