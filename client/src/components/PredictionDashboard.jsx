import React, { useEffect, useState } from 'react';
import { getPrediction } from '../api';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const PredictionDashboard = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPrediction();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("AI Models not ready or data missing.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-blue-400">Analyzing Market Microstructure...</div>;
  if (error) return <div className="p-10 text-center text-red-400 border border-red-800 rounded bg-red-900/20">{error}</div>;
  if (!data) return null;

  const isBullish = data.regime.direction === 'BULLISH';
  const isHighVol = data.regime.volatility === 'RISING_VOL';

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="NIFTY Spot" value={data.nifty_spot} />
        <StatCard label="India VIX" value={data.india_vix} />
        <StatCard label="Pred. Volatility" value={(data.metrics.predicted_annualized_vol * 100).toFixed(2) + '%'} />
        <StatCard 
          label="Bull Probability" 
          value={(data.metrics.bull_probability * 100).toFixed(1) + '%'} 
          color={isBullish ? 'text-green-400' : 'text-red-400'} 
        />
      </div>

      {/* Main Strategy Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-2 h-full ${isBullish ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Recommended Strategy</h2>
            <h1 className="text-3xl font-bold text-white mt-1 flex items-center gap-3">
              {data.recommendation.strategy.replace(/_/g, ' ')}
              {isBullish ? <TrendingUp className="text-green-500" /> : <TrendingDown className="text-red-500" />}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase">Expiry</div>
            <div className="text-xl font-mono text-blue-300 flex items-center gap-2 justify-end">
              <Calendar size={18} />
              {data.recommendation.expiry_date}
            </div>
            <div className="text-xs text-slate-500 mt-1">{data.recommendation.expiry_type}</div>
          </div>
        </div>

        {/* Trade Legs */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm text-slate-400 mb-3 flex items-center gap-2">
            <Activity size={16} /> Execution Legs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.recommendation.legs).map(([action, strike]) => (
              <div key={action} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                <span className={`font-mono font-bold ${action.includes('BUY') ? 'text-green-400' : 'text-red-400'}`}>
                  {action.replace('_', ' ')}
                </span>
                <span className="text-xl font-bold text-white">{strike}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Regimes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RegimeCard title="Direction Regime" value={data.regime.direction} type={isBullish ? 'bull' : 'bear'} />
        <RegimeCard title="Volatility Regime" value={data.regime.volatility} type={isHighVol ? 'danger' : 'safe'} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color = 'text-white' }) => (
  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
    <div className="text-slate-400 text-xs uppercase mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

const RegimeCard = ({ title, value, type }) => {
  const colors = {
    bull: 'bg-green-900/30 text-green-400 border-green-800',
    bear: 'bg-red-900/30 text-red-400 border-red-800',
    danger: 'bg-orange-900/30 text-orange-400 border-orange-800',
    safe: 'bg-blue-900/30 text-blue-400 border-blue-800',
    neutral: 'bg-slate-700 text-slate-300 border-slate-600'
  };
  
  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between ${colors[type] || colors.neutral}`}>
      <span className="font-semibold">{title}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
};

export default PredictionDashboard;