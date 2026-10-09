import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, FileText, X, Plus, Edit2, Save, MessageCircle } from 'lucide-react';
import { posService } from '../services/posService';

const BukuUtang = () => {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    setDebts(posService.getDebts());
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Semua'); // Semua | Lunas | Belum Lunas
  
  // Modal Kelola/Cicil States
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [newTotalAmount, setNewTotalAmount] = useState('');

  // Add Debt Modal States
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [newDebtForm, setNewDebtForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredDebts = debts.filter(debt => {
    const matchSearch = debt.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'Semua' || 
                        (filter === 'Lunas' && debt.status === 'Lunas') || 
                        (filter === 'Belum Lunas' && debt.status !== 'Lunas');
    return matchSearch && matchFilter;
  });

  const calculateAge = (dateStr, settledDateStr) => {
    const start = new Date(dateStr);
    const end = settledDateStr ? new Date(settledDateStr) : new Date();
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  const formatDebtAge = (totalDays) => {
    if (totalDays < 30) return `${totalDays} Hari`;
    if (totalDays < 365) {
      const months = Math.floor(totalDays / 30);
      const days = totalDays % 30;
      return `${months} Bulan${days > 0 ? ` ${days} Hari` : ''}`;
    }
    const years = Math.floor(totalDays / 365);
    const remDays = totalDays % 365;
    const months = Math.floor(remDays / 30);
    const days = remDays % 30;
    
    let res = `${years} Tahun`;
    if (months > 0) res += ` ${months} Bulan`;
    if (days > 0) res += ` ${days} Hari`;
    return res;
  };

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    const aUnpaid = a.status !== 'Lunas';
    const bUnpaid = b.status !== 'Lunas';
    if (aUnpaid && !bUnpaid) return -1;
    if (!aUnpaid && bUnpaid) return 1;

    const ageA = calculateAge(a.date, a.settledDate);
    const ageB = calculateAge(b.date, b.settledDate);

    if (aUnpaid && bUnpaid) {
      return ageB - ageA; // Oldest unpaid first
    }
    return ageB - ageA; // Oldest paid first
  });

  const handleManageClick = (debt) => {
    setSelectedDebt(debt);
    setInstallmentAmount('');
    setIsEditingTotal(false);
    setNewTotalAmount(debt.amount);
    setIsManageModalOpen(true);
  };

  const submitInstallment = () => {
    if (selectedDebt && installmentAmount > 0) {
      posService.payInstallment(selectedDebt.id, Number(installmentAmount));
      setDebts(posService.getDebts());
      setIsManageModalOpen(false);
    }
  };

  const handleTandaiLunas = () => {
    if (selectedDebt) {
      const remaining = selectedDebt.amount - (selectedDebt.amountPaid || 0);
      posService.payInstallment(selectedDebt.id, remaining);
      setDebts(posService.getDebts());
      setIsManageModalOpen(false);
    }
  };

  const handleUpdateTotal = () => {
    if (selectedDebt && newTotalAmount >= (selectedDebt.amountPaid || 0)) {
      const remaining = Number(newTotalAmount) - (selectedDebt.amountPaid || 0);
      let status = selectedDebt.status;
      let settledDate = selectedDebt.settledDate;
      if (remaining === 0) {
        status = 'Lunas';
        settledDate = new Date().toISOString().split('T')[0];
      } else if (selectedDebt.amountPaid > 0) {
        status = `Dicicil (Sisa Rp ${remaining.toLocaleString('id-ID')})`;
        settledDate = undefined;
      } else {
        status = 'Belum Lunas';
        settledDate = undefined;
      }
      
      const updatedDebt = { ...selectedDebt, amount: Number(newTotalAmount), status, settledDate };
      posService.updateDebt(updatedDebt);
      setDebts(posService.getDebts());
      setIsEditingTotal(false);
      setSelectedDebt(updatedDebt);
    }
  };

  const handleAddDebt = (e) => {
    e.preventDefault();
    posService.addDebt({
      name: newDebtForm.name,
      amount: Number(newDebtForm.amount),
      date: newDebtForm.date,
      notes: newDebtForm.notes,
      status: 'Belum Lunas',
      amountPaid: 0,
      paymentHistory: []
    });
    setDebts(posService.getDebts());
    setIsAddDebtModalOpen(false);
    setNewDebtForm({
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleWhatsApp = (debt) => {
    const remaining = debt.amount - (debt.amountPaid || 0);
    const age = calculateAge(debt.date, debt.settledDate);
    const text = `Halo Kak ${debt.name}, sekadar mengingatkan catatan kasbon di Toko Madura sebesar Rp ${remaining.toLocaleString('id-ID')} (Keterangan: ${debt.notes || '-'}) yang sudah berjalan ${formatDebtAge(age)}. Mohon dapat melakukan pelunasan/cicilan. Terima kasih!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalUtang = debts
    .filter(d => d.status !== 'Lunas')
    .reduce((sum, d) => sum + (d.amount - (d.amountPaid || 0)), 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buku Utang</h1>
          <p className="text-slate-500 mt-1">Kelola catatan utang pelanggan</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsAddDebtModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} /> Catat Utang Manual
          </button>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Total Piutang Belum Lunas</p>
              <p className="text-2xl font-bold text-emerald-600">
                Rp {totalUtang.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsAddDebtModalOpen(true)}
        className="md:hidden flex justify-center items-center gap-2 px-4 py-3 mb-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-colors"
      >
        <Plus size={18} /> Catat Utang Manual
      </button>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['Semua', 'Belum Lunas', 'Lunas'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-4 font-semibold text-sm">Pelanggan</th>
              <th className="p-4 font-semibold text-sm">Tanggal</th>
              <th className="p-4 font-semibold text-sm">Nominal</th>
              <th className="p-4 font-semibold text-sm">Umur Piutang</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedDebts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  Tidak ada data utang yang ditemukan.
                </td>
              </tr>
            ) : (
              sortedDebts.map(debt => {
                const age = calculateAge(debt.date, debt.settledDate);
                let badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                let badgeText = 'Aman';
                
                if (debt.status === 'Lunas') {
                  badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  badgeText = 'Selesai';
                } else if (age > 14) {
                  badgeColor = 'bg-red-100 text-red-700 border-red-200';
                  badgeText = 'Menunggak';
                } else if (age >= 7) {
                  badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
                  badgeText = 'Waspada';
                }

                return (
                  <tr key={debt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      <div>
                        {debt.name}
                        {debt.notes && <p className="text-xs text-slate-500 font-normal mt-0.5">{debt.notes}</p>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(debt.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      Rp {debt.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800">
                          {debt.status === 'Lunas' ? `Lunas dlm ${formatDebtAge(age)}` : `Aktif ${formatDebtAge(age)}`}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border w-fit ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                    {debt.status === 'Lunas' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle size={14} />
                        Lunas
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${debt.status.startsWith('Dicicil') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <Clock size={14} />
                        {debt.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {debt.status !== 'Lunas' && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleWhatsApp(debt)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center"
                          title="Ingatkan via WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleManageClick(debt)}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                          Kelola / Cicil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Kelola / Cicil */}
      {isManageModalOpen && selectedDebt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Kelola Utang Pelanggan</h3>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-800 mb-2">Pelanggan: <span className="font-bold">{selectedDebt.name}</span></p>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>Total Utang Awal:</span>
                  {isEditingTotal ? (
                    <div className="flex gap-1">
                      <input 
                        type="number" 
                        value={newTotalAmount}
                        onChange={(e) => setNewTotalAmount(e.target.value)}
                        className="w-24 px-1 border border-slate-300 rounded font-medium text-slate-700 focus:outline-none"
                      />
                      <button onClick={handleUpdateTotal} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Save size={14}/></button>
                      <button onClick={() => setIsEditingTotal(false)} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X size={14}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Rp {selectedDebt.amount.toLocaleString('id-ID')}</span>
                      <button onClick={() => setIsEditingTotal(true)} className="text-blue-500 hover:text-blue-700" title="Koreksi Nominal"><Edit2 size={12}/></button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Sudah Dibayar:</span>
                  <span className="font-medium text-slate-700">Rp {(selectedDebt.amountPaid || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between text-sm font-bold text-slate-800">
                  <span>Sisa Utang Aktual:</span>
                  <span className="text-red-500">Rp {(selectedDebt.amount - (selectedDebt.amountPaid || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Riwayat Pembayaran</h4>
                {(!selectedDebt.paymentHistory || selectedDebt.paymentHistory.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center p-2 bg-slate-50 rounded border border-slate-100">Belum ada riwayat pembayaran.</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="p-2 font-semibold text-slate-600 border-b border-slate-200">Tanggal</th>
                          <th className="p-2 font-semibold text-slate-600 border-b border-slate-200">Jenis</th>
                          <th className="p-2 font-semibold text-slate-600 border-b border-slate-200 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDebt.paymentHistory.map((ph, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                            <td className="p-2 text-slate-600">{new Date(ph.date).toLocaleDateString('id-ID')}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ph.type === 'Pelunasan' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {ph.type}
                              </span>
                            </td>
                            <td className="p-2 text-slate-800 font-bold text-right">Rp {ph.amount.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bayar Cicilan (Rp)</label>
                <input 
                  type="number"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                  placeholder="0"
                  min="0"
                  max={selectedDebt.amount - (selectedDebt.amountPaid || 0)}
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button 
                  onClick={submitInstallment}
                  disabled={!installmentAmount || installmentAmount <= 0}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Cicilan
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleTandaiLunas}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    Tandai Lunas
                  </button>
                  <button 
                    onClick={() => setIsManageModalOpen(false)}
                    className="flex-1 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Utang Manual */}
      {isAddDebtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Catat Utang Manual</h3>
              <button onClick={() => setIsAddDebtModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Pelanggan</label>
                <input 
                  type="text" required
                  value={newDebtForm.name}
                  onChange={(e) => setNewDebtForm({...newDebtForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nominal Utang (Rp)</label>
                <input 
                  type="number" required min="0"
                  value={newDebtForm.amount}
                  onChange={(e) => setNewDebtForm({...newDebtForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-bold text-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Catatan Barang</label>
                <textarea 
                  value={newDebtForm.notes}
                  onChange={(e) => setNewDebtForm({...newDebtForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  rows="2"
                  placeholder="Misal: Beras 5kg, Telur 1kg..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                <input 
                  type="date" required
                  value={newDebtForm.date}
                  onChange={(e) => setNewDebtForm({...newDebtForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddDebtModalOpen(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BukuUtang;
