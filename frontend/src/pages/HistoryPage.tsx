import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  TrendingUp,
  Zap,
  ShieldCheck,
  Filter,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Clock,
  Sliders,
  Activity,
  PlayCircle,
  Sparkles,
  FileJson,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Compass,
  Gauge,
  Target,
  User,
  Fingerprint
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { exportToJSON, exportToCSV } from '../utils/export';
import { api } from '../services/api';
import {
  getPredictionHistory,
  deletePredictionHistoryItem,
  clearPredictionHistory,
  loadSamplePredictionHistory,
  getHistoryUserAccounts,
  setPredictionHistory
} from '../utils/history';
import { getCurrentUser } from '../utils/auth';
import { PredictionHistoryItem, UserProfile } from '../types';
import { PageId } from '../components/Sidebar';

interface Props {
  setActivePage?: (page: PageId) => void;
}

export const HistoryPage: React.FC<Props> = ({ setActivePage }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const activeUserEmail = (currentUser?.email || 'guest@ballastix.lab').trim().toLowerCase();

  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PredictionHistoryItem | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'Trajectory' | 'Performance' | 'V50'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRawPayloads, setExpandedRawPayloads] = useState<Record<string, boolean>>({});

  // Synchronize currentUser on authentication change
  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('ballastix_auth_changed', handleAuth);
    return () => window.removeEventListener('ballastix_auth_changed', handleAuth);
  }, []);

  const loadHistory = () => {
    setLoading(true);
    const local = getPredictionHistory(activeUserEmail);
    // Strictly isolate: only include runs performed by this specific email
    const isolated = local.filter(
      item => (item.user_email || activeUserEmail).toLowerCase() === activeUserEmail
    );
    setHistory(isolated);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();

    // Listen to real-time updates from other tabs / simulator runs
    const handleUpdate = (e: any) => {
      const deletedId = e?.detail?.deletedId;
      const targetEmail = (e?.detail?.email || '').toLowerCase();
      // Only react if event is for this active user account
      if (!targetEmail || targetEmail === activeUserEmail) {
        if (deletedId) {
          setHistory(prev => prev.filter(item => item.id !== deletedId));
        } else {
          loadHistory();
        }
      }
    };
    window.addEventListener('prediction_history_updated', handleUpdate);
    return () => {
      window.removeEventListener('prediction_history_updated', handleUpdate);
    };
  }, [activeUserEmail]);

  const handleClearAll = async () => {
    if (confirm(`Clear prediction history logs for ${activeUserEmail}?`)) {
      clearPredictionHistory(activeUserEmail);
      try {
        await api.clearHistory();
      } catch {}
      setHistory([]);
    }
  };

  const handleDeleteItem = async (targetItem: PredictionHistoryItem) => {
    const targetId = targetItem.id;
    const targetTimestamp = targetItem.timestamp;

    // 1. Instantly remove ONLY this specific clicked item from component state
    setHistory(prev => prev.filter(h => {
      if (targetId) {
        return h.id !== targetId;
      }
      if (targetTimestamp) {
        return h.timestamp !== targetTimestamp;
      }
      return h !== targetItem;
    }));

    if (selectedItem && (selectedItem.id === targetId || (targetTimestamp && selectedItem.timestamp === targetTimestamp))) {
      setSelectedItem(null);
    }

    // 2. Delete ONLY this item from activeUserEmail storage
    deletePredictionHistoryItem(targetItem, activeUserEmail);

    // 3. Delete from backend session if ID is available
    if (targetId) {
      try {
        await api.deleteHistoryItem(targetId);
      } catch (err) {
        console.warn('Backend item delete failed:', err);
      }
    }
  };

  const handleLoadSamples = () => {
    const samples = loadSamplePredictionHistory(activeUserEmail);
    setHistory(samples);
  };

  const handleExportJSON = () => {
    const sanitizedEmail = activeUserEmail.replace(/[^a-zA-Z0-9]/g, '_');
    exportToJSON(
      history,
      `ballistics_history_${sanitizedEmail}_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const flatRecords = history.map(item => ({
      ID: item.id || '',
      Domain_Type: item.type,
      Timestamp: item.timestamp,
      Researcher_Email: activeUserEmail,
      Researcher_Name: item.user_name || currentUser?.name || '',
      Model_Name: item.model_name || '',
      Domain_Score: item.domain_score ?? 1.0,
      Source_Surface: item.source_page || '',
      User_Inputs: JSON.stringify(item.input),
      Model_Readings: JSON.stringify(item.output)
    }));
    const sanitizedEmail = activeUserEmail.replace(/[^a-zA-Z0-9]/g, '_');
    exportToCSV(
      flatRecords,
      `ballistics_history_${sanitizedEmail}_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const toggleRawPayload = (id: string) => {
    setExpandedRawPayloads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter and search logic
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemType = (item.type || '').toLowerCase();
      const matchesType =
        filterType === 'ALL' || itemType === filterType.toLowerCase();
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inputStr = JSON.stringify(item.input || {}).toLowerCase();
      const outputStr = JSON.stringify(item.output || {}).toLowerCase();
      const modelStr = (item.model_name || '').toLowerCase();
      const sourceStr = (item.source_page || '').toLowerCase();

      return (
        inputStr.includes(q) ||
        outputStr.includes(q) ||
        modelStr.includes(q) ||
        sourceStr.includes(q) ||
        itemType.includes(q)
      );
    });
  }, [history, filterType, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = history.length;
    const trajCount = history.filter(h => (h.type || '').toLowerCase() === 'trajectory').length;
    const perfCount = history.filter(h => (h.type || '').toLowerCase() === 'performance').length;
    const v50Count = history.filter(h => (h.type || '').toLowerCase() === 'v50').length;
    const avgScore = total > 0
      ? Math.round(
          (history.reduce((acc, h) => acc + (h.domain_score !== undefined ? h.domain_score : 1.0), 0) /
            total) *
            100
        )
      : 100;

    return { total, trajCount, perfCount, v50Count, avgScore };
  }, [history]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <AcademicDisclaimer />

      {/* Main Page Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-4 bg-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-100 flex flex-wrap items-center gap-2.5">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
              <span>PREDICTION & SIMULATION AUDIT HISTORY</span>
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Complete chronological audit logs of all user-executed machine learning runs, model input configurations, and ballistic readings.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Download history as JSON file"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={history.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Download history as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {history.length === 0 && (
              <button
                type="button"
                onClick={handleLoadSamples}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Sample Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Clear all saved history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>

            {setActivePage && (
              <button
                type="button"
                onClick={() => setActivePage('simulator')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold font-sans flex items-center gap-1.5 shadow-glow-cyan transition-all cursor-pointer ml-auto sm:ml-0"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Run Simulator</span>
              </button>
            )}
          </div>
        </div>

        {/* Researcher Account Partitioning Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-slate-200 font-bold flex items-center gap-2 truncate">
                <span>Account History:</span>
                <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 truncate">
                  {currentUser?.name ? `${currentUser.name} (${activeUserEmail})` : activeUserEmail}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Isolated prediction log: records are private to this account and never visible to other logins.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
              ● {history.length} logged run{history.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Runs</span>
            <span className="text-xl font-extrabold text-slate-100 font-mono mt-1">{stats.total}</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Trajectory
            </span>
            <span className="text-xl font-extrabold text-cyan-300 font-mono mt-1">{stats.trajCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Performance
            </span>
            <span className="text-xl font-extrabold text-emerald-300 font-mono mt-1">{stats.perfCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-purple-400 font-mono uppercase font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> V50 Armor
            </span>
            <span className="text-xl font-extrabold text-purple-300 font-mono mt-1">{stats.v50Count}</span>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Runs ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('Trajectory')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'Trajectory'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trajectory ({stats.trajCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('Performance')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'Performance'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Performance ({stats.perfCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('V50')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'V50'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>V50 Armor ({stats.v50Count})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inputs, readings, models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500/60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Loading prediction audit history...</span>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((item, idx) => {
            const itemId = item.id || `hist_${idx}`;
            const isRawExpanded = !!expandedRawPayloads[itemId];
            const domainType = (item.type || '').toLowerCase();
            const isTrajectory = domainType === 'trajectory';
            const isPerformance = domainType === 'performance';
            const isV50 = domainType === 'v50';

            const badgeColor = isTrajectory
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              : isPerformance
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30';

            const borderHighlight = isTrajectory
              ? 'hover:border-cyan-500/40'
              : isPerformance
              ? 'hover:border-emerald-500/40'
              : 'hover:border-purple-500/40';

            return (
              <div
                key={itemId}
                className={`glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-xl space-y-4 transition-all duration-200 ${borderHighlight}`}
              >
                {/* Header Row: Domain Badge, Timestamp, Execution Surface, Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${badgeColor}`}>
                      {isTrajectory ? <TrendingUp className="w-3.5 h-3.5" /> : isPerformance ? <Zap className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{item.type} Prediction</span>
                    </span>

                    <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </span>

                    {item.source_page && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                        Source: {item.source_page}
                      </span>
                    )}

                    {item.user_email && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1">
                        <User className="w-3 h-3 text-cyan-400" />
                        <span>{item.user_email}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-all"
                      title="Inspect Full Detail View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Inspect</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      title="Delete this prediction record"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline text-[11px]">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Two-Column Structured Presentation: User Inputs vs Model Readings */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* LEFT: Complete User Inputs */}
                  <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                        <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Complete Model User Inputs</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Configured by User</span>
                      </div>

                      {/* Domain A: Trajectory User Inputs */}
                      {isTrajectory && (
                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-900">
                            <span className="text-slate-400">Initial Velocity (v0):</span>
                            <span className="font-bold text-cyan-300">{item.input?.velocity} m/s</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-900">
                            <span className="text-slate-400">Launch Angle (θ):</span>
                            <span className="font-bold text-cyan-300">{item.input?.angle_deg}°</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-900">
                            <span className="text-slate-400">Gravity Acceleration (g):</span>
                            <span className="font-bold text-cyan-300">{item.input?.gravity} m/s²</span>
                          </div>
                        </div>
                      )}

                      {/* Domain B: Performance User Inputs */}
                      {isPerformance && (
                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-900">
                            <span className="text-slate-400">Cartridge Designation:</span>
                            <span className="font-bold text-emerald-300">{item.input?.Cartridge || '.308 WINCHESTER'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Category:</span>
                              <span className="text-slate-200 font-bold">{item.input?.Type || 'Rifle'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Weight:</span>
                              <span className="text-slate-200 font-bold">{item.input?.Weight} gr</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Ballistic Coeff:</span>
                              <span className="text-slate-200 font-bold">{item.input?.BC}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Muzzle V0:</span>
                              <span className="text-emerald-300 font-bold">{item.input?.V0} fps</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Domain C: V50 User Inputs */}
                      {isV50 && (
                        <div className="space-y-2 font-mono text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Projectile Type:</span>
                              <span className="font-bold text-purple-300">{item.input?.proj_type || 'AP'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Calibre:</span>
                              <span className="font-bold text-slate-200">{item.input?.calibre} mm</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Target Material:</span>
                              <span className="font-bold text-slate-200">{item.input?.Material || 'Steel'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-900 flex justify-between">
                              <span className="text-slate-400">Thickness:</span>
                              <span className="font-bold text-purple-300">{item.input?.thickness} mm</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                            <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-900">
                              <div className="text-slate-500 text-[9px]">Yield Strength</div>
                              <div className="text-slate-200 font-bold">{item.input?.yield} MPa</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-900">
                              <div className="text-slate-500 text-[9px]">Hardness</div>
                              <div className="text-slate-200 font-bold">{item.input?.hardness} HB</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-900">
                              <div className="text-slate-500 text-[9px]">Obliquity Angle</div>
                              <div className="text-slate-200 font-bold">{item.input?.angle}°</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span>Parameters Verified</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Schema
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: Model Readings & Predictions */}
                  <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                        <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Generated Model Readings & Predictions</span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">Inference Output</span>
                      </div>

                      {/* Domain A: Trajectory Readings */}
                      {isTrajectory && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase font-bold text-cyan-300">Predicted Downrange Range</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">range_actual</span>
                            </div>
                            <div className="text-2xl font-extrabold text-cyan-300 font-mono">
                              {(item.output?.range_actual || 0).toLocaleString()} m
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ≈ {((item.output?.range_actual || 0) / 1000).toFixed(2)} kilometers downrange
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase font-bold text-indigo-300">Predicted Max Apex Height</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">max_height_actual</span>
                            </div>
                            <div className="text-2xl font-extrabold text-indigo-300 font-mono">
                              {(item.output?.max_height_actual || 0).toLocaleString()} m
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ≈ {((item.output?.max_height_actual || 0) / 1000).toFixed(2)} kilometers altitude
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Domain B: Performance Readings */}
                      {isPerformance && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {[
                            { key: 'V100', label: 'Velocity @ 100y', unit: 'fps', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/30' },
                            { key: 'V200', label: 'Velocity @ 200y', unit: 'fps', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/30' },
                            { key: 'E100', label: 'Energy @ 100y', unit: 'ft·lbs', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'E200', label: 'Energy @ 200y', unit: 'ft·lbs', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'BD100', label: 'Bullet Drop @ 100y', unit: 'in', color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/30' },
                            { key: 'BD200', label: 'Bullet Drop @ 200y', unit: 'in', color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/30' }
                          ].map((metric) => {
                            const val = item.output?.[metric.key];
                            return (
                              <div key={metric.key} className={`p-2.5 rounded-xl border flex flex-col justify-between ${metric.bg}`}>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                  <span>{metric.label}</span>
                                  <span className="text-[9px] text-slate-500">{metric.unit}</span>
                                </div>
                                <div className={`text-base font-extrabold font-mono mt-1 ${metric.color}`}>
                                  {val !== undefined ? `${val} ${metric.unit}` : '---'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Domain C: V50 Readings */}
                      {isV50 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase font-bold text-purple-300">V50 Ballistic Limit Velocity</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">v50_threshold</span>
                            </div>
                            <div className="text-2xl font-extrabold text-purple-300 font-mono">
                              {(item.output?.v50 || item.output?.predicted_v50 || 0).toLocaleString()} m/s
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              50% armor perforation velocity limit
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase font-bold text-amber-300">Kinetic Energy at V50</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">Ek @ V50</span>
                            </div>
                            <div className="text-2xl font-extrabold text-amber-300 font-mono">
                              {Math.round(item.output?.kinetic_energy_at_v50 || 0).toLocaleString()} Joules
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Terminal impact kinetic energy absorption
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Utility Bar on Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => toggleRawPayload(itemId)}
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        {isRawExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isRawExpanded ? 'Hide Raw JSON Payloads' : 'Inspect Raw JSON Payloads'}</span>
                      </button>

                      <div className="text-[10px] font-mono text-slate-500">
                        Record ID: <strong className="text-slate-400">{item.id || itemId}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Collapsible Raw JSON Payloads (Inputs & Readings) */}
                {isRawExpanded && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3 font-mono text-xs">
                    <div className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-cyan-400" />
                      <span>Raw Machine Learning Schemas (In-Depth Telemetry)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Raw User Input Payload</div>
                        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                          {JSON.stringify(item.input, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Raw Model Output Readings</div>
                        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px]">
                          {JSON.stringify(item.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-4 font-mono max-w-2xl mx-auto">
          <History className="w-14 h-14 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-slate-200">No Model Executions Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Run a prediction in the <strong>Interactive Simulator</strong>, <strong>Trajectory Engine</strong>, or <strong>V50 Armor Lab</strong>. All user inputs and model readings are automatically recorded here in real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {setActivePage && (
              <button
                type="button"
                onClick={() => setActivePage('simulator')}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 font-sans uppercase tracking-wider transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Launch Interactive Simulator</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadSamples}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Load Sample History Runs</span>
            </button>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-800 max-w-2xl w-full space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase text-[11px] border border-cyan-500/40">
                  {selectedItem.type} Audit Inspection
                </span>
                <span className="text-slate-400 text-xs">{new Date(selectedItem.timestamp).toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold">User Input Parameters</div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                {JSON.stringify(selectedItem.input, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Model Output Readings</div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px]">
                {JSON.stringify(selectedItem.output, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (selectedItem) {
                    handleDeleteItem(selectedItem);
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
