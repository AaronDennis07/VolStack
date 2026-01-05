import React, { useState } from 'react';
import PredictionDashboard from './components/PredictionDashboard';
import DataEntry from './components/DataEntry';
import DataViewer from './components/DataViewer';
import { LineChart, LayoutDashboard, Database, PlusCircle, Menu, X } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 pb-20 md:pb-0">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
              <LineChart size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-white">
              Vol<span className="text-blue-500">Stack</span>
            </span>
          </div>
          
          {/* Desktop Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex bg-slate-800/50 rounded-lg p-1 gap-1 border border-slate-700/50">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={18} />}
              label="Strategy"
            />
            <TabButton 
              active={activeTab === 'view'} 
              onClick={() => setActiveTab('view')} 
              icon={<Database size={18} />}
              label="History"
            />
            <TabButton 
              active={activeTab === 'entry'} 
              onClick={() => setActiveTab('entry')} 
              icon={<PlusCircle size={18} />}
              label="Add Data"
            />
          </div>

          {/* Mobile Menu Toggle (Visible only on Mobile) */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Dropdown Menu (Animate height or simple block) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-2 absolute w-full left-0 shadow-2xl">
             <MobileTabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              icon={<LayoutDashboard size={20} />}
              label="Strategy Deck"
            />
            <MobileTabButton 
              active={activeTab === 'view'} 
              onClick={() => { setActiveTab('view'); setIsMobileMenuOpen(false); }} 
              icon={<Database size={20} />}
              label="Historical Data"
            />
            <MobileTabButton 
              active={activeTab === 'entry'} 
              onClick={() => { setActiveTab('entry'); setIsMobileMenuOpen(false); }} 
              icon={<PlusCircle size={20} />}
              label="Add New Entry"
            />
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white">Market Intelligence</h1>
              <p className="text-sm md:text-base text-slate-400">Real-time XGBoost volatility forecasting.</p>
            </div>
            <PredictionDashboard refreshTrigger={refreshTrigger} />
          </div>
        )}

        {activeTab === 'view' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white">Historical Data</h1>
              <p className="text-sm md:text-base text-slate-400">View NIFTY 50 and India VIX datasets.</p>
            </div>
            <DataViewer />
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white">Data Ingestion</h1>
              <p className="text-sm md:text-base text-slate-400">Append today's OHLC data.</p>
            </div>
            <DataEntry onUpdateSuccess={handleDataUpdate} />
          </div>
        )}
      </main>

      {/* Optional: Bottom Navigation Bar for Mobile (App-like feel) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-2 z-50 safe-area-bottom">
        <BottomNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<LayoutDashboard size={20} />}
          label="Strategy"
        />
        <BottomNavButton 
          active={activeTab === 'view'} 
          onClick={() => setActiveTab('view')} 
          icon={<Database size={20} />}
          label="History"
        />
        <BottomNavButton 
          active={activeTab === 'entry'} 
          onClick={() => setActiveTab('entry')} 
          icon={<PlusCircle size={20} />}
          label="Add"
        />
      </div>

    </div>
  );
}

// Desktop Tab Button
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
      active 
        ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' 
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Mobile Dropdown Item
const MobileTabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-slate-800 text-blue-400' 
        : 'text-slate-400 hover:bg-slate-800/50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Bottom Nav Item (App Style)
const BottomNavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
      active ? 'text-blue-500' : 'text-slate-500'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

export default App;