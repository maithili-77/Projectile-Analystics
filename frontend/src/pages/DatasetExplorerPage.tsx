import React, { useEffect, useState } from 'react';
import { Database, Search, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { api } from '../services/api';
import { exportToCSV } from '../utils/export';
import { PaginatedDataResponse } from '../types';

export const DatasetExplorerPage: React.FC = () => {
  const [activeDataset, setActiveDataset] = useState<string>('accurate_ballastic');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState<string>('');
  const [data, setData] = useState<PaginatedDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const res = await api.getDatasetData(activeDataset, page, pageSize, search);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [activeDataset, page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDataset();
  };

  const handleExport = () => {
    if (data && data.records.length > 0) {
      exportToCSV(data.records, `${activeDataset}_page_${page}`);
    }
  };

  const datasets = [
    { id: 'accurate_ballastic', name: '1. Trajectory Dataset', rows: '10,000 rows' },
    { id: 'ballistics_500', name: '2. Cartridges Dataset', rows: '500 rows' },
    { id: 'v50_database', name: '3. V50 Armor Database', rows: '1,084 rows' },
  ];

  const columns = data?.records && data.records.length > 0 ? Object.keys(data.records[0]) : [];

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Interactive Dataset Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Search, Filter, Paginate, and Export raw research records
          </p>
        </div>

        {/* Dataset Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {datasets.map((ds) => (
            <button
              key={ds.id}
              onClick={() => {
                setActiveDataset(ds.id);
                setPage(1);
                setSearch('');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeDataset === ds.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ds.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search across all dataset columns..."
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

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExport}
            disabled={!data || data.records.length === 0}
            className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Fetching records from dataset...</span>
          </div>
        ) : data && data.records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3 text-slate-500">#</th>
                  {columns.map((col) => (
                    <th key={col} className="p-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.records.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500 text-[10px]">
                      {(data.page - 1) * data.page_size + rIdx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap max-w-[200px] truncate" title={String(row[col])}>
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
            No matching records found for query.
          </div>
        )}

        {/* Pagination Footer */}
        {data && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing <strong className="text-slate-200">{data.records.length}</strong> of{' '}
              <strong className="text-cyan-400">{data.total_records.toLocaleString()}</strong> records
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={data.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page <strong className="text-slate-200">{data.page}</strong> of{' '}
                <strong className="text-slate-200">{data.total_pages}</strong>
              </span>
              <button
                disabled={data.page >= data.total_pages}
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
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
