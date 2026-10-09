import React, { useState, useEffect } from 'react';
import { ShoppingCart, BookOpen, ClipboardList, Store, ChevronDown, Settings } from 'lucide-react';
import { posService } from '../services/posService';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [activeOperator, setActiveOperatorState] = useState('');
  const [isOperatorMenuOpen, setIsOperatorMenuOpen] = useState(false);

  useEffect(() => {
    setActiveOperatorState(posService.getActiveOperator());
  }, []);

  const handleOperatorChange = (name) => {
    posService.setActiveOperator(name);
    setActiveOperatorState(name);
    setIsOperatorMenuOpen(false);
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

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
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
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
      <div className="mt-auto pt-4 border-t border-slate-800 relative">
        {isOperatorMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => handleOperatorChange(op)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${activeOperator === op ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}
              >
                {op}
              </button>
            ))}
          </div>
        )}
        <button 
          onClick={() => setIsOperatorMenuOpen(!isOperatorMenuOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400">
              <span className="text-sm font-bold">{activeOperator ? activeOperator.charAt(0) : 'K'}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white truncate max-w-[120px]">{activeOperator}</p>
              <p className="text-xs text-slate-500">Ubah Operator</p>
            </div>
          </div>
          <ChevronDown size={16} className={`transition-transform ${isOperatorMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
