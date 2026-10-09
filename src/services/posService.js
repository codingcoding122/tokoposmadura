import { products as initialProducts, debts as initialDebts, shiftRecords as initialShiftRecords } from '../data/mockData';

const POS_STORAGE_KEY = 'tokoposmadura_data';

const getDefaultData = () => ({
  products: initialProducts,
  debts: initialDebts,
  shiftRecords: initialShiftRecords,
  transactions: []
});

export const posService = {
  // Ambil semua data
  getAllData: () => {
    try {
      const data = localStorage.getItem(POS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading data from localStorage', error);
    }
    const defaultData = getDefaultData();
    posService.saveAllData(defaultData);
    return defaultData;
  },

  // Simpan semua data
  saveAllData: (data) => {
    try {
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage', error);
    }
  },

  // Produk
  getProducts: () => posService.getAllData().products,
  
  saveProducts: (products) => {
    const data = posService.getAllData();
    data.products = products;
    posService.saveAllData(data);
  },

  addProduct: (product) => {
    const data = posService.getAllData();
    data.products.push({ ...product, id: Date.now() });
    posService.saveAllData(data);
  },

  updateProduct: (updatedProduct) => {
    const data = posService.getAllData();
    data.products = data.products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    posService.saveAllData(data);
  },

  deleteProduct: (id) => {
    const data = posService.getAllData();
    data.products = data.products.filter(p => p.id !== id);
    posService.saveAllData(data);
  },

  // Transaksi Kasir
  getTransactions: () => posService.getAllData().transactions,

  // Operator
  getActiveOperator: () => {
    return localStorage.getItem('tokoposmadura_operator') || 'Kasir 1 (Shift Pagi)';
  },
  
  setActiveOperator: (name) => {
    localStorage.setItem('tokoposmadura_operator', name);
  },

  updateStock: (productId, newStock) => {
    const data = posService.getAllData();
    data.products = data.products.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    );
    posService.saveAllData(data);
  },

  deductStock: (cartItems) => {
    const data = posService.getAllData();
    data.products = data.products.map(product => {
      const cartItem = cartItems.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, stock: Math.max(0, product.stock - cartItem.qty) };
      }
      return product;
    });
    posService.saveAllData(data);
  },

  addTransaction: (transaction) => {
    const data = posService.getAllData();
    const operator = posService.getActiveOperator();
    data.transactions.push({ ...transaction, operator, id: Date.now() });
    
    // Update Shift Record (ambil shift pertama sebagai dummy active shift)
    if (data.shiftRecords && data.shiftRecords.length > 0) {
      const activeShift = data.shiftRecords[0];
      activeShift.operator = operator;
      const isUtang = transaction.paymentType === 'Bon';
      const amount = transaction.total || 0;

      activeShift.totalSales += amount;
      if (isUtang) {
        activeShift.debt += amount;
      } else {
        activeShift.cash += amount;
      }
      data.shiftRecords[0] = activeShift;
    }

    posService.saveAllData(data);
    posService.deductStock(transaction.cart);
  },

  // Buku Utang
  getDebts: () => posService.getAllData().debts,

  addDebt: (debt) => {
    const data = posService.getAllData();
    data.debts.push({ ...debt, paymentHistory: [], id: Date.now() });
    posService.saveAllData(data);
  },
  
  updateDebt: (updatedDebt) => {
    const data = posService.getAllData();
    data.debts = data.debts.map(d => d.id === updatedDebt.id ? updatedDebt : d);
    posService.saveAllData(data);
  },

  payInstallment: (debtId, amount) => {
    const data = posService.getAllData();
    data.debts = data.debts.map(d => {
      if (d.id === debtId) {
        const amountPaid = (d.amountPaid || 0) + amount;
        const remaining = d.amount - amountPaid;
        let status = d.status;
        const paymentHistory = d.paymentHistory || [];
        
        let type = 'Cicilan';
        if (remaining <= 0) {
          status = 'Lunas';
          d.settledDate = new Date().toISOString().split('T')[0];
          type = 'Pelunasan';
        } else {
          status = `Dicicil (Sisa Rp ${remaining.toLocaleString('id-ID')})`;
          delete d.settledDate; // In case it was previously lunas
        }
        
        paymentHistory.push({
          date: new Date().toISOString(),
          amount: amount,
          type: type
        });
        
        return { ...d, amountPaid, status, paymentHistory };
      }
      return d;
    });
    posService.saveAllData(data);
  },

  // Shift
  getShiftRecords: () => posService.getAllData().shiftRecords,
  
  saveShiftRecords: (records) => {
    const data = posService.getAllData();
    data.shiftRecords = records;
    posService.saveAllData(data);
  }
};
