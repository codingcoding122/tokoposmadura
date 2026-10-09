export const products = [
  { id: 1, name: 'Beras 5kg', category: 'Sembako', price: 65000, stock: 15 },
  { id: 2, name: 'Gula Pasir 1kg', category: 'Sembako', price: 16000, stock: 20 },
  { id: 3, name: 'Minyak Goreng 2L', category: 'Sembako', price: 34000, stock: 4 },
  { id: 4, name: 'Gas LPG 3kg', category: 'Gas', price: 20000, stock: 8 },
  { id: 5, name: 'Aqua Galon (Isi Ulang)', category: 'Galon', price: 6000, stock: 5 },
  { id: 6, name: 'Aqua Galon (Baru)', category: 'Galon', price: 19000, stock: 2 },
  { id: 7, name: 'Surya 16', category: 'Rokok', price: 32000, stock: 10 },
  { id: 8, name: 'Sampoerna Mild', category: 'Rokok', price: 30000, stock: 12 },
  { id: 9, name: 'Gudang Garam Filter', category: 'Rokok', price: 24000, stock: 3 },
  { id: 10, name: 'Telur Ayam 1kg', category: 'Sembako', price: 28000, stock: 10 },
  { id: 11, name: 'Indomie Goreng', category: 'Sembako', price: 3500, stock: 45 },
  { id: 12, name: 'Kopi Kapal Api', category: 'Sembako', price: 1500, stock: 30 },
];

export const debts = [
  { id: 1, name: 'Pak Budi', amount: 150000, date: '2023-10-25', status: 'Belum Lunas' },
  { id: 2, name: 'Bu Siti', amount: 85000, date: '2023-10-24', status: 'Belum Lunas' },
  { id: 3, name: 'Mas Anton', amount: 30000, date: '2023-10-20', status: 'Lunas' },
];

export const shiftRecords = [
  { id: 1, shift: 'Pagi', operator: 'Kasir 1', date: '2023-10-26', totalSales: 850000, cash: 800000, debt: 50000 },
  { id: 2, shift: 'Malam', operator: 'Kasir 2', date: '2023-10-25', totalSales: 1200000, cash: 1200000, debt: 0 },
];
