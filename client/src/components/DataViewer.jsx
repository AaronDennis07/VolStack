import React, { useEffect, useState, useMemo } from 'react';
import { getNiftyHistory, getVixHistory } from '../api';
import { ArrowUp, ArrowDown, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const DataViewer = () => {
  const [activeTab, setActiveTab] = useState('NIFTY'); // 'NIFTY' or 'VIX'
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Date Filters (Default to empty)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch 1000 days so we have a large history to filter through
      const res = activeTab === 'NIFTY' ? await getNiftyHistory(1000) : await getVixHistory(1000);
      setRawData([...res.data].reverse()); // Newest first
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Reset filters when switching tabs
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  }, [activeTab]);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    if (!fromDate && !toDate) return rawData;

    return rawData.filter(row => {
      // Parse CSV Date (DD-MM-YYYY) to JS Date Object
      const [day, month, year] = row.Date.split('-');
      const rowDate = new Date(`${year}-${month}-${day}`);
      
      let isValid = true;
      if (fromDate) {
        const start = new Date(fromDate);
        isValid = isValid && rowDate >= start;
      }
      if (toDate) {
        const end = new Date(toDate);
        isValid = isValid && rowDate <= end;
      }
      return isValid;
    });
  }, [rawData, fromDate, toDate]);

  // --- PAGINATION LOGIC (Applied to Filtered Data) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate]);

  const formatNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <div className="space-y-4">
      
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        
        {/* Tab Switcher */}
        <div>
          <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Data Source</label>
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('NIFTY')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'NIFTY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              NIFTY
            </button>
            <button
              onClick={() => setActiveTab('VIX')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === 'VIX' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              VIX
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">From</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg block w-full p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Till</label>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg block w-full p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <button 
            onClick={loadData} 
            className="mt-5 p-2.5 bg-slate-700 rounded-lg hover:bg-slate-600 text-slate-300 border border-slate-600"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Close</th>
                <th className="px-6 py-3">Open</th>
                <th className="px-6 py-3">High</th>
                <th className="px-6 py-3">Low</th>
                {activeTab === 'VIX' && <th className="px-6 py-3">Change</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading Data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-slate-500">No data found for selected range</td></tr>
              ) : (
                currentItems.map((row, idx) => {
                  const close = Number(row.Close);
                  const open = Number(row.Open);
                  const change = Number(row.Change);
                  
                  const isUp = activeTab === 'VIX' ? change > 0 : close > open; 
                  
                  return (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">{row.Date}</td>
                      <td className={`px-6 py-4 font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {formatNumber(row.Close)}
                      </td>
                      <td className="px-6 py-4">{formatNumber(row.Open)}</td>
                      <td className="px-6 py-4">{formatNumber(row.High)}</td>
                      <td className="px-6 py-4">{formatNumber(row.Low)}</td>
                      {activeTab === 'VIX' && (
                        <td className={`px-6 py-4 flex items-center gap-1 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change > 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                          {Math.abs(change).toFixed(2)}%
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredData.length > 0 && (
          <div className="flex justify-between items-center px-6 py-3 bg-slate-900/30 border-t border-slate-700">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            <span className="text-xs text-slate-500 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataViewer;