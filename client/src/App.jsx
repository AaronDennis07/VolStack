import React, { useState } from 'react';
import PredictionDashboard from './components/PredictionDashboard';
import DataEntry from './components/DataEntry';
import { LineChart, LayoutDashboard, Database } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    // When data is updated, switch to dashboard and refresh prediction
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <LineChart size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">NIFTY <span className="text-blue-500">AI</span></span>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={16} />}
              label="Strategy Deck"
            />
            <TabButton 
              active={activeTab === 'data'} 
              onClick={() => setActiveTab('data')} 
              icon={<Database size={16} />}
              label="Data Feed"
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Market Forecast</h1>
              <p className="text-slate-400">AI-driven volatility and direction prediction for NIFTY 50 options.</p>
            </div>
            <PredictionDashboard refreshTrigger={refreshTrigger} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Data Feed</h1>
              <p className="text-slate-400">Update historical CSVs to recalibrate the AI models.</p>
            </div>
            <DataEntry onUpdateSuccess={handleDataUpdate} />
          </div>
        )}
      </main>

    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
      active 
        ? 'bg-slate-700 text-white shadow-sm' 
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;