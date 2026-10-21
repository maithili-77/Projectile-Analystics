import React from 'react';
import {
  Home,
  Calculator,
  PlayCircle,
  FlaskConical,
  BarChart3,
  Cpu,
  Database,
  History,
  Info,
  ChevronLeft,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { HealthStatus } from '../types';

export type PageId =
  | 'home'
  | 'calculator'
  | 'simulator'
  | 'history'
  | 'about';

interface Props {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  health: HealthStatus | null;
  loading: boolean;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<Props> = ({
  activePage,
  setActivePage,
  health,
  loading,
  isOpenMobile,
  setIsOpenMobile,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'simulator', label: 'Simulator', icon: PlayCircle },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'about', label: 'About', icon: Info },
  ];


  const handleSelect = (id: PageId) => {
    setActivePage(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            BALLASTIX
          </span>
        </div>
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Desktop / Tablet / Mobile Drawer */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div>
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div
              onClick={() => handleSelect('home')}
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-glow-cyan shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              {(!isCollapsed || isOpenMobile) && (
                <div className="truncate">
                  <div className="text-sm font-black tracking-wider text-slate-100 uppercase leading-snug">
                    BALLASTIX
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">ANALYTICS PLATFORM</div>
                </div>
              )}
            </div>

            {/* Collapse toggle button for tablet/desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as PageId)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {(!isCollapsed || isOpenMobile) && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
};
