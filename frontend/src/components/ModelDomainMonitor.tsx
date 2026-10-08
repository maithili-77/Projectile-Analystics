import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Props {
  domainScore: number; // 0.0 to 1.0
  explanation?: string;
}

export const ModelDomainMonitor: React.FC<Props> = ({ domainScore, explanation }) => {
  const scorePct = Math.round(domainScore * 100);

  let statusLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let statusText = 'Input inside normal training domain';
  let Icon = ShieldCheck;

  if (scorePct < 80 && scorePct >= 50) {
    statusLevel = 'YELLOW';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    statusText = 'Near training boundary';
    Icon = AlertTriangle;
  } else if (scorePct < 50) {
    statusLevel = 'RED';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    statusText = 'Far outside training domain';
    Icon = AlertOctagon;
  }

  return (
    <div className="p-4 rounded-xl glass-card border border-slate-800 space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between font-sans">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Icon className={`w-4 h-4 ${statusLevel === 'GREEN' ? 'text-emerald-400' : statusLevel === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'}`} />
          <span>MODEL DOMAIN MONITOR</span>
        </h4>
        <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono border ${badgeColor}`}>
          {scorePct}% Coverage ({statusLevel})
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
        <span>Domain Status: <strong className={statusLevel === 'GREEN' ? 'text-emerald-400' : statusLevel === 'YELLOW' ? 'text-amber-400' : 'text-rose-400'}>{statusText}</strong></span>
        <span className="text-[10px] text-slate-500">Metric: Input Domain Coverage</span>
      </div>

      {explanation && (
        <p className="text-[10px] text-slate-400 leading-relaxed pt-1 font-sans">
          {explanation}
        </p>
      )}
    </div>
  );
};
