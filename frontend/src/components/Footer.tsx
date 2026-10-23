import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Academic ML Research Platform &bull; Ballastic Prediction System</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Research & Educational Use Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
