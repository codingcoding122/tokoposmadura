import { useState } from 'react';
import Sidebar from './components/Sidebar';
import PosKasir from './components/PosKasir';
import BukuUtang from './components/BukuUtang';
import RekapShift from './components/RekapShift';
import KatalogPublik from './components/KatalogPublik';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('pos');

  const renderContent = () => {
    switch (activeTab) {
      case 'pos':
        return <PosKasir />;
      case 'utang':
        return <BukuUtang />;
      case 'rekap':
        return <RekapShift />;
      case 'katalog':
        return <KatalogPublik />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <PosKasir />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-3 sm:p-4 lg:p-6 h-full overflow-y-auto lg:overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;