import React from 'react';

interface Props {
  columns: string[];
  values: number[][];
  title: string;
}

export const CorrelationMatrix: React.FC<Props> = ({ columns, values, title }) => {
  if (!columns || !values || columns.length === 0) {
    return <div className="text-xs text-slate-500 font-mono">No correlation data.</div>;
  }

  const getColorClass = (val: number) => {
    if (val === 1) return 'bg-cyan-500/80 text-slate-950 font-bold';
    if (val >= 0.7) return 'bg-cyan-600/60 text-cyan-100';
    if (val >= 0.4) return 'bg-cyan-800/40 text-cyan-200';
    if (val >= 0.1) return 'bg-slate-800/60 text-slate-300';
    if (val >= -0.1) return 'bg-slate-900/40 text-slate-400';
    if (val >= -0.4) return 'bg-rose-950/40 text-rose-300';
    return 'bg-rose-800/60 text-rose-100';
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800">
      <h3 className="text-sm font-bold text-slate-200 mb-3">{title} - Correlation Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono border-collapse">
          <thead>
            <tr>
              <th className="p-1 border border-slate-800 text-slate-400 bg-slate-900/80"></th>
              {columns.map((col, idx) => (
                <th key={idx} className="p-1.5 border border-slate-800 text-slate-300 bg-slate-900/80 max-w-[70px] truncate" title={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="p-1.5 border border-slate-800 font-semibold text-slate-300 bg-slate-900/80 max-w-[80px] truncate" title={columns[rIdx]}>
                  {columns[rIdx]}
                </td>
                {row.map((val, cIdx) => (
                  <td
                    key={cIdx}
                    className={`p-1 border border-slate-800 text-center transition-colors ${getColorClass(val)}`}
                    title={`${columns[rIdx]} vs ${columns[cIdx]}: ${val}`}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
