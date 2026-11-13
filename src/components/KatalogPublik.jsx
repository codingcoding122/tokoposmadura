import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Send, User, MapPin, X } from 'lucide-react';
import { posService } from '../services/posService';

const KatalogPublik = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    // Muat produk dari posService
    setProducts(posService.getProducts());
  }, []);

  // Otomatis tutup keranjang mobile jika layar di-resize ke ukuran desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileCartOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tutup keranjang mobile dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    setCart(prev => {
      const nextCart = prev.filter(item => item.id !== id);
      if (nextCart.length === 0) {
        setIsMobileCartOpen(false);
      }
      return nextCart;
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

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

  // Render daftar item keranjang
  const renderCartItems = () => (
    <div className="space-y-3">
      {cart.map(item => (
        <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm items-center">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-800 text-sm leading-tight mb-1 truncate">{item.name}</h4>
            <p className="text-emerald-600 font-bold text-sm">
              Rp {(item.price * item.qty).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button 
              onClick={() => removeFromCart(item.id)} 
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Hapus produk"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button 
                onClick={() => updateQty(item.id, -1)}
                className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                aria-label="Kurangi"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
              <button 
                onClick={() => updateQty(item.id, 1)}
                className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                aria-label="Tambah"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render form checkout WhatsApp
  const renderCartFooter = () => (
    <div className="p-4 sm:p-5 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <span className="text-slate-500 font-medium text-sm">Total Estimasi</span>
        <span className="text-xl sm:text-2xl font-bold text-slate-900">
          Rp {total.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
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
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
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
        className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-emerald-500/30 active:scale-[0.98]"
      >
        <Send size={18} />
        KIRIM PESANAN VIA WA
      </button>
    </div>
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-full gap-4 lg:gap-6 bg-slate-100 font-sans">
      {/* =========================================================================
          KIRI: DAFTAR PRODUK (KATALOG PUBLIK) - Melebar 100% jika keranjang kosong
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-3 sm:mb-4">Katalog Toko Madura</h1>
          
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk yang ingin dibeli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-800 placeholder-slate-400 transition-all text-sm sm:text-base"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border shrink-0 ${
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

        {/* Grid Produk: Melebar penuh saat cart.length === 0 */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50 ${cart.length > 0 ? 'pb-24 lg:pb-5' : 'pb-5'}`}>
          <div className={`grid gap-3 sm:gap-4 ${
            cart.length === 0 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-3 sm:p-4 flex-1">
                  <div className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100 inline-block px-2 py-0.5 sm:py-1 rounded mb-2">
                    {product.category}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-1">
                    {product.name}
                  </h3>
                  <p className="font-bold text-emerald-600 text-base sm:text-lg mt-2">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${product.stock <= 5 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                    Tersedia: {product.stock}
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
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
              <p className="text-sm">Maaf, produk tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          KANAN: KERANJANG PUBLIK (Hanya tampil jika ada item di keranjang)
         ========================================================================= */}
      {cart.length > 0 && (
        <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-emerald-500 text-white flex justify-between items-center shrink-0">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <ShoppingCart size={20} /> Keranjang Saya
            </h2>
            <span className="bg-white text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
              {cart.length} Item
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {renderCartItems()}
          </div>

          {renderCartFooter()}
        </div>
      )}

      {/* =========================================================================
          FLOATING ACTION BUTTON (FAB) KERANJANG KHUSUS LAYAR KECIL (< lg)
         ========================================================================= */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="relative flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 sm:px-5 py-3 rounded-full shadow-2xl border-2 border-white/20 transition-all duration-200"
            aria-label="Buka Keranjang Belanja"
          >
            <div className="relative">
              <ShoppingCart size={22} className="sm:w-6 sm:h-6" />
              {totalItemCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] sm:text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalItemCount > 99 ? '99+' : totalItemCount}
                </span>
              )}
            </div>
            <div className="text-left font-sans">
              <div className="text-[10px] uppercase tracking-wider text-emerald-100 font-semibold leading-none">
                {cart.length} Item
              </div>
              <div className="text-xs sm:text-sm font-bold leading-tight">
                Rp {total.toLocaleString('id-ID')}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL / BOTTOM SHEET KERANJANG MOBILE (< lg)
         ========================================================================= */}
      {isMobileCartOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end sm:justify-center items-center">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Bottom Sheet / Dialog */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* Indikator Handle Bar untuk Tampilan Mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Header Bottom Sheet */}
            <div className="px-4 py-3 border-b border-slate-100 bg-emerald-500 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base">Keranjang Saya</h2>
                  <p className="text-xs text-emerald-100">{cart.length} Jenis Item ({totalItemCount} total)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup Keranjang"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Item Keranjang */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[40vh] sm:max-h-[45vh] bg-slate-50">
              {renderCartItems()}
            </div>

            {/* Footer Form & Kirim WA */}
            {renderCartFooter()}
          </div>
        </div>
      )}
    </div>
  );
};

export default KatalogPublik;
