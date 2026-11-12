import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  BookOpen, 
  ClipboardList, 
  Store, 
  ChevronDown, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';
import { posService } from '../services/posService';

const Sidebar = ({ activeTab, setActiveTab, mobileVariant = 'drawer' }) => {
  const [activeOperator, setActiveOperatorState] = useState(() => posService.getActiveOperator());
  const [isDesktopOperatorOpen, setIsDesktopOperatorOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileOperatorOpen, setIsMobileOperatorOpen] = useState(false);

  const desktopOperatorRef = useRef(null);
  const mobileOperatorRef = useRef(null);

  // Tutup drawer saat layar di-resize ke ukuran desktop (>= 1024px / lg)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileDrawerOpen(false);
        setIsMobileOperatorOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kunci scrolling body ketika drawer mobile sedang terbuka
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Tutup drawer dan dropdown dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setIsDesktopOperatorOpen(false);
        setIsMobileOperatorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tutup dropdown operator saat klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopOperatorRef.current && !desktopOperatorRef.current.contains(e.target)) {
        setIsDesktopOperatorOpen(false);
      }
      if (mobileOperatorRef.current && !mobileOperatorRef.current.contains(e.target)) {
        setIsMobileOperatorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOperatorChange = (name) => {
    posService.setActiveOperator(name);
    setActiveOperatorState(name);
    setIsDesktopOperatorOpen(false);
    setIsMobileOperatorOpen(false);
  };

  const operators = [
    'Kasir 1 (Shift Pagi)',
    'Kasir 2 (Shift Malam)',
    'Kasir 3 (Shift Subuh)',
    'Admin / Pemilik Toko'
  ];
  const isAdmin = activeOperator === 'Admin / Pemilik Toko';

  const menuItems = [
    { id: 'pos', name: 'POS Kasir', icon: ShoppingCart, show: true },
    { id: 'utang', name: 'Buku Utang', icon: BookOpen, show: true },
    { id: 'rekap', name: 'Rekap Shift & Stok', icon: ClipboardList, show: true },
    { id: 'katalog', name: 'Katalog Pelanggan', icon: Store, show: true },
    { id: 'admin', name: 'Panel Admin', icon: Settings, show: isAdmin },
  ];

  const currentTab = menuItems.find(item => item.id === activeTab);
  const currentTabName = currentTab ? currentTab.name : 'POS Kasir';
  const operatorInitial = activeOperator ? activeOperator.charAt(0) : 'K';

  return (
    <>
      {/* =========================================================================
          1. HEADER KHUSUS MOBILE & TABLET (Tampil hanya di layar kecil / < lg)
         ========================================================================= */}
      <header className="lg:hidden w-full bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center space-x-3">
          {/* Tombol Hamburger Menu */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Buka Menu Navigasi"
            className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <Menu size={22} />
          </button>

          {/* Logo Brand Toko Madura & Indikator Halaman Aktif */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-emerald-500 tracking-tight">Toko Madura</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700 hidden sm:inline-block">
              {currentTabName}
            </span>
          </div>
        </div>

        {/* Status & Pengubah Cepat Operator di Header */}
        <button
          onClick={() => {
            setIsMobileDrawerOpen(true);
            setIsMobileOperatorOpen(true);
          }}
          className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 py-1.5 px-3 rounded-full text-left transition-colors"
          title="Ubah Operator / Shift"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
            {operatorInitial}
          </div>
          <span className="text-xs text-slate-200 font-medium max-w-[120px] truncate hidden sm:inline-block">
            {activeOperator || 'Operator'}
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </header>

      {/* =========================================================================
          2. HAMBURGER DRAWER (OFF-CANVAS) UNTUK MOBILE & TABLET (< lg)
         ========================================================================= */}
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setIsMobileDrawerOpen(false);
          setIsMobileOperatorOpen(false);
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel Menu */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-slate-900 text-white p-4 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-emerald-500">Toko Madura</h2>
            <p className="text-xs text-slate-400">Point of Sale</p>
          </div>
          <button
            onClick={() => {
              setIsMobileDrawerOpen(false);
              setIsMobileOperatorOpen(false);
            }}
            aria-label="Tutup Menu Navigasi"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Daftar Navigasi Mobile Drawer */}
        <nav className="flex-1 overflow-y-auto pr-1">
          <ul className="space-y-1.5">
            {menuItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                      isActive 
                        ? 'bg-emerald-600 text-white font-medium shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Dropdown Pemilih Operator di Bagian Bawah Drawer */}
        <div ref={mobileOperatorRef} className="mt-auto pt-4 border-t border-slate-800 relative">
          {isMobileOperatorOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                Pilih Operator / Shift
              </div>
              {operators.map((op) => (
                <button
                  key={op}
                  onClick={() => handleOperatorChange(op)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                    activeOperator === op ? 'text-emerald-400 font-semibold bg-slate-700/50' : 'text-slate-300'
                  }`}
                >
                  <span>{op}</span>
                  {activeOperator === op && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => setIsMobileOperatorOpen(!isMobileOperatorOpen)}
            className="w-full flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="text-sm font-bold">{operatorInitial}</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-white truncate max-w-[140px]">{activeOperator}</p>
                <p className="text-xs text-slate-400">Ketuk untuk ubah operator</p>
              </div>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 shrink-0 ${isMobileOperatorOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. BOTTOM NAVIGATION (OPSIONAL / ALTERNATIF, bila mobileVariant === 'bottom')
         ========================================================================= */}
      {mobileVariant === 'bottom' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 flex items-center justify-around py-1.5 px-2 shadow-2xl">
          {menuItems.filter(item => item.show).slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
                  isActive ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-0.5 max-w-[65px] truncate">{item.name}</span>
              </button>
            );
          })}
          {/* Tombol menu untuk opsi lainnya / operator */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={18} />
            <span className="text-[10px] mt-0.5">Lainnya</span>
          </button>
        </nav>
      )}

      {/* =========================================================================
          4. SIDEBAR VERSI DESKTOP (TETAP UTUH, tampil hanya di layar besar >= lg)
         ========================================================================= */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white min-h-screen p-4 flex-col shrink-0">
        <div className="mb-8 mt-4 text-center">
          <h1 className="text-2xl font-bold text-emerald-500">Toko Madura</h1>
          <p className="text-sm text-slate-400">Point of Sale</p>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div ref={desktopOperatorRef} className="mt-auto pt-4 border-t border-slate-800 relative">
          {isDesktopOperatorOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                Pilih Operator / Shift
              </div>
              {operators.map((op) => (
                <button
                  key={op}
                  onClick={() => handleOperatorChange(op)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                    activeOperator === op ? 'text-emerald-400 font-medium bg-slate-700/40' : 'text-slate-300'
                  }`}
                >
                  <span>{op}</span>
                  {activeOperator === op && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => setIsDesktopOperatorOpen(!isDesktopOperatorOpen)}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400">
                <span className="text-sm font-bold">{operatorInitial}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{activeOperator}</p>
                <p className="text-xs text-slate-500">Ubah Operator</p>
              </div>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isDesktopOperatorOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
