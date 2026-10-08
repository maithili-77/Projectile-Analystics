import React from 'react';
import { ShieldAlert, BookOpen } from 'lucide-react';

export const AcademicDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 backdrop-blur-md flex items-start gap-3 text-amber-200/90 text-sm">
      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-amber-300 flex items-center gap-2 mb-1">
          <span>ACADEMIC & RESEARCH COMPLIANCE NOTICE</span>
          <span className="px-2 py-0.5 text-xs rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            RESEARCH USE ONLY
          </span>
        </div>
        <p className="leading-relaxed">
          This platform is developed strictly for academic machine learning research, educational visualization, and computational physics demonstration. It does <strong>NOT</strong> generate operational weapon guidance, targeting solutions, firing calculations, or real-world weapon optimization.
        </p>
      </div>
    </div>
  );
};
