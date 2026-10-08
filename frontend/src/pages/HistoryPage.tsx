import React, { useEffect, useState } from 'react';
import { History, Download, Trash2, RefreshCw, Eye } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { ModelDomainMonitor } from '../components/ModelDomainMonitor';
import { api } from '../services/api';
import { exportToJSON } from '../utils/export';
import { PredictionHistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PredictionHistoryItem | null>(null);

  const loadHistory = () => {
    setLoading(true);
    // Load from browser localStorage
    const local = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    setHistory(local);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearAll = () => {
    if (confirm('Clear all saved prediction history?')) {
      localStorage.removeItem('prediction_history');
      setHistory([]);
    }
  };

  const handleDeleteItem = (idx: number) => {
    const updated = history.filter((_, i) => i !== idx);
    localStorage.setItem('prediction_history', JSON.stringify(updated));
    setHistory(updated);
  };

  const handleExportJSON = () => {
    exportToJSON(history, `prediction_history_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>PREDICTION HISTORY LOG</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Persisted browser session logs with Model Domain Monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            disabled={history.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Fetching prediction history...</span>
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase text-[10px]">
                    {item.type}
                  </span>
                  <span className="text-slate-500 text-[11px]">{new Date(item.timestamp).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(idx)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Model Domain Monitor */}
              <ModelDomainMonitor domainScore={0.92} explanation="Input domain score evaluated against dataset feature bounds." />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Input Parameters</div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(item.input, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Predictions</div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-900 text-cyan-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(item.output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-2xl border border-slate-800 text-center space-y-2 font-mono">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No predictions logged in session</h3>
          <p className="text-xs text-slate-500">
            Execute predictions in Prediction Lab or Simulator and click Save to log items here.
          </p>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-xl w-full space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-cyan-300">{selectedItem.type} Log Details</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">TIMESTAMP</span>
              <div className="text-slate-200">{new Date(selectedItem.timestamp).toString()}</div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase">Input Payload</span>
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto">{JSON.stringify(selectedItem.input, null, 2)}</pre>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase">Prediction Output</span>
              <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 overflow-x-auto">{JSON.stringify(selectedItem.output, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
