import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { HealthStatus } from '../types';

interface Props {
  status: HealthStatus | null;
  loading: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-400 font-mono">
        <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span>Connecting API...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>API Offline</span>
      </div>
    );
  }

  const loadedStr = status.models_loaded || '9/9';
  const isAllReady = !loadedStr.startsWith('0');

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur-md border ${
      isAllReady
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    }`}>
      {isAllReady ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      )}
      <span>
        API Active &bull; ML Models: {loadedStr} Ready
      </span>
    </div>
  );
};
