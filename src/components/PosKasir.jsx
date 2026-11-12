import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, User, ShoppingCart, X, CheckCircle2 } from 'lucide-react';
import { posService } from '../services/posService';

const PosKasir = () => {
  const [products, setProducts] = useState(() => posService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('Tunai'); // Tunai | Bon
  const [customerName, setCustomerName] = useState('');
  
  // State untuk Bottom Sheet / Modal Keranjang di Layar Mobile (< lg)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modal & Checkout States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState(0);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // Struk Thermal States
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

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
        setIsPaymentModalOpen(false);
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
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return;
    if (paymentType === 'Bon') {
      if (!customerName.trim()) {
        alert('Nama pelanggan harus diisi untuk pembayaran Bon (Utang)!');
        return;
      }
      setIsMobileCartOpen(false);
      processCheckout();
    } else {
      setCashReceived(total);
      setIsMobileCartOpen(false);
      setIsPaymentModalOpen(true);
    }
  };

  const processCheckout = () => {
    const operator = posService.getActiveOperator();
    // Siapkan data transaksi
    const transactionData = {
      cart: [...cart],
      total: total,
      paymentType: paymentType,
      customerName: customerName,
      cashReceived: paymentType === 'Bon' ? 0 : cashReceived,
      operator: operator,
      date: new Date().toISOString()
    };
    
    // Simpan transaksi (otomatis update shift & potong stok)
    posService.addTransaction(transactionData);
    
    // Jika tipe pembayaran Bon, tambahkan ke buku utang
    if (paymentType === 'Bon') {
      posService.addDebt({
        name: customerName,
        amount: total,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Belum Lunas'
      });
    }
    
    // Refresh state produk agar stok terbaru tampil
    setProducts(posService.getProducts());

    setReceiptData(transactionData);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handleFinishTransaction = () => {
    setCart([]);
    setCustomerName('');
    setCashReceived(0);
    setReceiptData(null);
    setIsReceiptModalOpen(false);
    
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const getDenominationRecommendation = (amount) => {
    if (amount <= 0) return '';
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    let remaining = amount;
    const result = [];
    
    for (const denom of denominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        result.push(`${count}x ${denom >= 1000 ? (denom/1000) + 'rb' : denom}`);
        remaining = remaining % denom;
      }
    }
    return result.join(' + ');
  };

  // Render isi item keranjang (dipakai bersama oleh versi Desktop dan Mobile)
  const renderCartItems = () => {
    if (cart.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
          <ShoppingCart size={48} className="mb-4 text-slate-200" />
          <p className="text-sm">Belum ada item di keranjang</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {cart.map(item => (
          <div key={item.id} className="flex gap-3 items-center">
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
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                <button 
                  onClick={() => updateQty(item.id, -1)}
                  className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                  aria-label="Kurangi jumlah"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                <button 
                  onClick={() => updateQty(item.id, 1)}
                  className="p-1 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                  aria-label="Tambah jumlah"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render footer checkout keranjang (Total, Pilihan Pembayaran, Tombol Bayar)
  const renderCartFooter = () => (
    <div className="p-4 border-t border-slate-100 bg-slate-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-slate-500 text-sm font-medium">Total Pembayaran</span>
        <span className="text-2xl font-bold text-slate-900">
          Rp {total.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setPaymentType('Tunai')}
          className={`py-2 rounded-lg font-medium text-sm transition-all border ${
            paymentType === 'Tunai' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tunai
        </button>
        <button
          onClick={() => setPaymentType('Bon')}
          className={`py-2 rounded-lg font-medium text-sm transition-all border ${
            paymentType === 'Bon' 
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
          }`}
        >
          Bon / Utang
        </button>
      </div>

      {paymentType === 'Bon' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nama Pelanggan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Masukkan nama..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleOpenPaymentModal}
        disabled={cart.length === 0}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg uppercase tracking-wide ${
          cart.length === 0 
            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
            : 'bg-green-500 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-green-500/30 active:scale-[0.98]'
        }`}
      >
        BAYAR SEKARANG
      </button>
    </div>
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
      {/* =========================================================================
          KIRI: DAFTAR PRODUK (Responsif: 2 kolom di mobile, 3 di tablet, 4 di desktop)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-w-0">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base"
            />
          </div>
          {/* Area Kategori Horizontal Scroll */}
          <div className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk: Khusus Mobile 2 Kolom (grid-cols-2), Tablet 3 (md:grid-cols-3), Desktop 4 (lg:grid-cols-3 xl:grid-cols-4) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50 pb-24 lg:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 text-left hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between active:scale-[0.98]"
              >
                <div>
                  <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 sm:py-1 rounded mb-1.5">
                    {product.category}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-1 group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-2 pt-1 border-t border-slate-50 gap-0.5">
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${product.stock <= 5 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    Stok: {product.stock}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              Produk tidak ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          KANAN: KERANJANG VERSI DESKTOP (TETAP UTUH di layar Desktop >= lg)
         ========================================================================= */}
      <div className="hidden lg:flex w-96 flex-col bg-white rounded-xl shadow-sm border border-slate-100 h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800">Keranjang</h2>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {renderCartItems()}
        </div>

        {renderCartFooter()}
      </div>

      {/* =========================================================================
          FLOATING ACTION BUTTON (FAB) KERANJANG KHUSUS LAYAR KECIL (< lg)
         ========================================================================= */}
      <div className="lg:hidden fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
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

      {/* =========================================================================
          MODAL / BOTTOM SHEET KERANJANG MOBILE (< lg)
         ========================================================================= */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end sm:justify-center items-center">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Bottom Sheet / Dialog */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* Indikator Handle Bar untuk Tampilan Mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Header Bottom Sheet */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-800">Keranjang Belanja</h2>
                  <p className="text-xs text-slate-500">{cart.length} Jenis Item ({totalItemCount} total)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Tutup Keranjang"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Item Keranjang */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[45vh] sm:max-h-[50vh]">
              {renderCartItems()}
            </div>

            {/* Footer Checkout */}
            {renderCartFooter()}
          </div>
        </div>
      )}

      {/* =========================================================================
          TOAST NOTIFIKASI TRANSAKSI BERHASIL
         ========================================================================= */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-white border border-green-200 shadow-xl rounded-xl p-4 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Transaksi Berhasil!</h4>
            <p className="text-xs text-slate-500">Nota telah dicetak & disimpan.</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL PEMBAYARAN TUNAI (Dengan Pembungkus Overflow-X untuk Layar Kecil)
         ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                  Pembayaran Tunai 
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Kasir Cepat</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">INV-{new Date().getTime().toString().slice(-6)}</p>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Modal Pembayaran */}
            <div className="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto overflow-x-auto">
              {/* Box Total Tagihan */}
              <div className="bg-slate-800 rounded-xl p-4 sm:p-5 flex justify-between items-center text-white shadow-inner">
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium tracking-wide">TOTAL TAGIHAN BELANJA</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">Rp {total.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-slate-300">{cart.length} Jenis Items</p>
                </div>
              </div>

              {/* Input Uang Tunai Diterima */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wide uppercase">Uang Tunai Diterima</label>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base sm:text-lg">Rp</span>
                  <input 
                    type="number" 
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xl sm:text-2xl text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
                    placeholder="0"
                  />
                </div>
                {/* Tombol Pecahan Cepat: 2 kolom di mobile, 4 kolom di layar sm ke atas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => setCashReceived(total)} className="py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-slate-200">Uang Pas</button>
                  <button onClick={() => setCashReceived(20000)} className="py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-slate-200">20.000</button>
                  <button onClick={() => setCashReceived(50000)} className="py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-slate-200">50.000</button>
                  <button onClick={() => setCashReceived(100000)} className="py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-slate-200">100.000</button>
                </div>
              </div>

              {/* Box Kembalian */}
              <div className={`p-4 rounded-xl border-2 transition-colors duration-300 ${cashReceived >= total ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`text-xs font-bold mb-1 tracking-wide uppercase ${cashReceived >= total ? 'text-green-600' : 'text-red-500'}`}>
                      Kembalian
                    </p>
                    <p className={`text-xl sm:text-2xl font-bold ${cashReceived >= total ? 'text-green-700' : 'text-red-600'}`}>
                      Rp {Math.max(0, cashReceived - total).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border shrink-0 ${cashReceived >= total ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {cashReceived >= total && <CheckCircle2 size={12} />}
                    {cashReceived >= total ? 'Uang Cukup' : 'Uang Kurang'}
                  </span>
                </div>
                {cashReceived > total && (
                  <div className="mt-3 pt-3 border-t border-green-200/50">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-green-200/50 rounded text-green-800 font-semibold">Saran Pecahan:</span> 
                      {getDenominationRecommendation(cashReceived - total)}
                    </p>
                  </div>
                )}
              </div>

              {/* Checkboxes Opsi Cetak & WhatsApp */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-x-auto">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={printReceipt} onChange={(e) => setPrintReceipt(e.target.checked)} className="w-4 h-4 sm:w-5 sm:h-5 accent-green-500 cursor-pointer" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Cetak Struk Thermal</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} className="w-4 h-4 sm:w-5 sm:h-5 accent-green-500 cursor-pointer" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Kirim via WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Footer Modal Pembayaran */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="px-4 sm:px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all text-sm sm:text-base"
              >
                Kembali
              </button>
              <button 
                onClick={processCheckout}
                disabled={cashReceived < total}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-sm flex justify-center items-center gap-2 text-sm sm:text-base ${cashReceived >= total ? 'bg-green-500 hover:bg-green-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                <CheckCircle2 size={18} className={cashReceived >= total ? 'text-green-100' : 'text-slate-400'} />
                PROSES & CETAK NOTA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL STRUK THERMAL (DIBUNGKUS OVERFLOW-X-AUTO AGAR BISA DI-SCROLL HORIZONTAL)
         ========================================================================= */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 w-full max-w-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Struk Pembayaran Thermal</h3>
              <button onClick={handleFinishTransaction} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Area Lebar Struk: Dibungkus overflow-x-auto dan overflow-y-auto */}
            <div className="p-4 sm:p-6 bg-white overflow-y-auto overflow-x-auto max-h-[60vh] flex justify-center print:p-0 print:m-0 w-full">
              <div className="overflow-x-auto min-w-full flex justify-center py-1">
                <div id="printable-receipt" className="w-full max-w-[58mm] text-center font-mono text-xs text-black shrink-0" style={{ width: '58mm' }}>
                  <h2 className="text-lg font-bold mb-1">TOKO MADURA 24 JAM</h2>
                  <p className="mb-1 text-[10px]">Jl. Contoh Alamat No. 123</p>
                  <p className="mb-3 text-[10px]">Telp: 0812-3456-7890</p>
                  
                  <div className="border-t border-dashed border-black my-2"></div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span>Tgl: {new Date(receiptData.date).toLocaleDateString('id-ID')}</span>
                    <span>Jam: {new Date(receiptData.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex justify-between text-[10px] mb-2">
                    <span>Kasir: {receiptData.operator}</span>
                    <span>{receiptData.paymentType}</span>
                  </div>
                  <div className="border-t border-dashed border-black my-2"></div>
                  
                  {/* Daftar Rincian Barang Struk */}
                  <div className="text-left mb-2 overflow-x-auto">
                    {receiptData.cart.map((item, idx) => (
                      <div key={idx} className="mb-1">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="flex justify-between">
                          <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                          <span>{(item.qty * item.price).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-dashed border-black my-2"></div>
                  
                  <div className="flex justify-between font-bold mb-1">
                    <span>Total:</span>
                    <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
                  </div>
                  {receiptData.paymentType === 'Tunai' ? (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Bayar:</span>
                        <span>Rp {receiptData.cashReceived.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Kembali:</span>
                        <span>Rp {Math.max(0, receiptData.cashReceived - receiptData.total).toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between mb-1 text-red-600 font-bold">
                      <span>Sisa Utang:</span>
                      <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-dashed border-black my-2"></div>
                  <p className="mt-2 text-[10px]">Terima Kasih</p>
                  <p className="text-[10px]">Selamat Belanja Kembali</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 print:hidden shrink-0">
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors shadow-sm text-sm"
              >
                Print Struk
              </button>
              <button 
                onClick={handleFinishTransaction}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors text-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for printing the thermal receipt */}
      {isReceiptModalOpen && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 58mm;
              margin: 0;
              padding: 0;
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default PosKasir;
