import React, { useState } from 'react';
import PredictionDashboard from './components/PredictionDashboard';
import DataEntry from './components/DataEntry';
import DataViewer from './components/DataViewer'; // Import the new component
import { LineChart, LayoutDashboard, Database, PlusCircle } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('dashboard'); // Auto-switch to results after adding data
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
              <LineChart size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Vol<span className="text-blue-500">Stack</span>
            </span>
          </div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={16} />}
              label="Strategy"
            />
            <TabButton 
              active={activeTab === 'view'} 
              onClick={() => setActiveTab('view')} 
              icon={<Database size={16} />}
              label="History"
            />
            <TabButton 
              active={activeTab === 'entry'} 
              onClick={() => setActiveTab('entry')} 
              icon={<PlusCircle size={16} />}
              label="Add Data"
            />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
              <p className="text-slate-400">Real-time XGBoost volatility forecasting and strategy generation.</p>
            </div>
            <PredictionDashboard refreshTrigger={refreshTrigger} />
          </div>
        )}

        {activeTab === 'view' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Historical Data</h1>
              <p className="text-slate-400">View the NIFTY 50 and India VIX datasets used for model calibration.</p>
            </div>
            <DataViewer />
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Data Ingestion</h1>
              <p className="text-slate-400">Append today's OHLC data to update the model state.</p>
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
        ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' 
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;