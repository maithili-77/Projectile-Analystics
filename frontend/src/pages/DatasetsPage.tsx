import React, { useEffect, useState } from 'react';
import { Database, Search, Download, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import { DatasetSummary, PaginatedDataResponse } from '../types';

export const DatasetsPage: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState<'trajectory' | 'performance' | 'v50'>('trajectory');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState<string>('');
  const [recordsData, setRecordsData] = useState<PaginatedDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      if (activeDomain === 'trajectory') {
        const res = await api.getTrajectorySummary();
        setSummary(res);
      } else if (activeDomain === 'performance') {
        const res = await api.getPerformanceSummary();
        setSummary(res);
      } else {
        const res = await api.getV50Summary();
        setSummary(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const datasetIdMap = {
        trajectory: 'accurate_ballastic',
        performance: 'ballistics_500',
        v50: 'v50_database',
      };
      const res = await api.getDatasetData(datasetIdMap[activeDomain], page, pageSize, search);
      setRecordsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchRecords();
  }, [activeDomain, page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleExport = () => {
    if (recordsData && recordsData.records.length > 0) {
      exportToCSV(recordsData.records, `${activeDomain}_dataset_page_${page}`);
    }
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Dataset Explorer & Summary Statistics</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Cached backend dataset summaries & live record filtering
          </p>
        </div>

        {/* Dataset Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setActiveDomain('trajectory'); setPage(1); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeDomain === 'trajectory' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Trajectory (10,000)
          </button>
          <button
            onClick={() => { setActiveDomain('performance'); setPage(1); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeDomain === 'performance' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Performance (500)
          </button>
          <button
            onClick={() => { setActiveDomain('v50'); setPage(1); setSearch(''); }}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeDomain === 'v50' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            V50 Material (1,084)
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div>
            <span className="text-slate-500 text-[10px] block">DATASET NAME</span>
            <span className="text-slate-100 font-bold">{summary.dataset_name}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">TOTAL ROWS</span>
            <span className="text-cyan-300 font-bold">{summary.total_rows.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">NUMERIC COLS</span>
            <span className="text-emerald-300 font-bold">{summary.numeric_columns.length}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">MISSING CELLS</span>
            <span className="text-amber-300 font-bold">{summary.missing_cells}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dataset records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
          >
            Search
          </button>
        </form>

        <button
          onClick={handleExport}
          disabled={!recordsData || recordsData.records.length === 0}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Page CSV</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading records...</span>
          </div>
        ) : recordsData && recordsData.records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3 text-slate-500">#</th>
                  {Object.keys(recordsData.records[0]).map((col) => (
                    <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recordsData.records.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500 text-[10px]">
                      {(recordsData.page - 1) * recordsData.page_size + rIdx + 1}
                    </td>
                    {Object.keys(row).map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap max-w-[200px] truncate">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 font-mono text-xs">
            No matching records found.
          </div>
        )}

        {/* Pagination Controls */}
        {recordsData && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing <strong className="text-slate-200">{recordsData.records.length}</strong> of{' '}
              <strong className="text-cyan-400">{recordsData.total_records.toLocaleString()}</strong> records
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={recordsData.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page <strong className="text-slate-200">{recordsData.page}</strong> of{' '}
                <strong className="text-slate-200">{recordsData.total_pages}</strong>
              </span>
              <button
                disabled={recordsData.page >= recordsData.total_pages}
                onClick={() => setPage(p => Math.min(recordsData.total_pages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
