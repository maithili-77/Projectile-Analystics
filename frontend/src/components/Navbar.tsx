import React from 'react';
import {
  Compass,
  TrendingUp,
  Zap,
  ShieldCheck,
  PlayCircle,
  BarChart3,
  Cpu,
  Database,
  History
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { HealthStatus } from '../types';
import { GunLogo } from './GunLogo';

export type TabId = 
  | 'overview'
  | 'trajectory'
  | 'ballistic'
  | 'v50'
  | 'simulator'
  | 'analytics'
  | 'insights'
  | 'explorer'
  | 'history';

interface Props {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  health: HealthStatus | null;
  loading: boolean;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, health, loading }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'trajectory', label: 'Trajectory Predictor', icon: TrendingUp },
    { id: 'ballistic', label: 'Ballistic Performance', icon: Zap },
    { id: 'v50', label: 'V50 Penetration', icon: ShieldCheck },
    { id: 'simulator', label: 'Interactive Simulator', icon: PlayCircle },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'insights', label: 'Model Insights', icon: Cpu },
    { id: 'explorer', label: 'Dataset Explorer', icon: Database },
    { id: 'history', label: 'Prediction History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <GunLogo size="md" />
            <div>
              <div className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
                <span>BALLASTIX</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded font-mono">
                  v2.0 ML
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Simulations & Prediction Platform</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="hidden lg:block">
            <StatusBadge status={health} loading={loading} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
