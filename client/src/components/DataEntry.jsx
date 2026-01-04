import React, { useState } from 'react';
import { feedNifty, feedVix } from '../api';
import { format } from 'date-fns';

const DataEntry = ({ onUpdateSuccess }) => {
  const today = format(new Date(), 'dd-MM-yyyy');
  
  const [niftyForm, setNiftyForm] = useState({
    Date: today, Open: '', High: '', Low: '', Close: '', 
    "Shares Traded": '', "Turnover (₹ Cr)": ''
  });
  
  const [vixForm, setVixForm] = useState({
    Date: today, Open: '', High: '', Low: '', Close: '', "Prev. Close": ''
  });

  const handleNiftySubmit = async (e) => {
    e.preventDefault();
    try {
      await feedNifty(niftyForm);
      alert('NIFTY Data Updated!');
      onUpdateSuccess();
    } catch (err) {
      alert('Error updating Nifty');
    }
  };

  const handleVixSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedVix(vixForm);
      alert('VIX Data Updated!');
      onUpdateSuccess();
    } catch (err) {
      alert('Error updating VIX');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* NIFTY FORM */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-blue-400">Update NIFTY 50</h3>
        <form onSubmit={handleNiftySubmit} className="space-y-3">
          <Input label="Date (DD-MM-YYYY)" value={niftyForm.Date} onChange={e => setNiftyForm({...niftyForm, Date: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Open" type="number" step="0.05" value={niftyForm.Open} onChange={e => setNiftyForm({...niftyForm, Open: e.target.value})} />
            <Input label="Close" type="number" step="0.05" value={niftyForm.Close} onChange={e => setNiftyForm({...niftyForm, Close: e.target.value})} />
            <Input label="High" type="number" step="0.05" value={niftyForm.High} onChange={e => setNiftyForm({...niftyForm, High: e.target.value})} />
            <Input label="Low" type="number" step="0.05" value={niftyForm.Low} onChange={e => setNiftyForm({...niftyForm, Low: e.target.value})} />
          </div>
          <Input label="Shares Traded" type="number" value={niftyForm["Shares Traded"]} onChange={e => setNiftyForm({...niftyForm, "Shares Traded": e.target.value})} />
          <Input label="Turnover (Cr)" type="number" step="0.01" value={niftyForm["Turnover (₹ Cr)"]} onChange={e => setNiftyForm({...niftyForm, "Turnover (₹ Cr)": e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold mt-2">Update Nifty</button>
        </form>
      </div>

      {/* VIX FORM */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-purple-400">Update India VIX</h3>
        <form onSubmit={handleVixSubmit} className="space-y-3">
          <Input label="Date" value={vixForm.Date} onChange={e => setVixForm({...vixForm, Date: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Open" type="number" step="0.01" value={vixForm.Open} onChange={e => setVixForm({...vixForm, Open: e.target.value})} />
            <Input label="Close" type="number" step="0.01" value={vixForm.Close} onChange={e => setVixForm({...vixForm, Close: e.target.value})} />
            <Input label="High" type="number" step="0.01" value={vixForm.High} onChange={e => setVixForm({...vixForm, High: e.target.value})} />
            <Input label="Low" type="number" step="0.01" value={vixForm.Low} onChange={e => setVixForm({...vixForm, Low: e.target.value})} />
          </div>
          <Input label="Prev. Close" type="number" step="0.01" value={vixForm["Prev. Close"]} onChange={e => setVixForm({...vixForm, "Prev. Close": e.target.value})} />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded font-bold mt-2">Update VIX</button>
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, type = "text", ...props }) => (
  <div>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <input 
      type={type} 
      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
      required
      {...props} 
    />
  </div>
);

export default DataEntry;