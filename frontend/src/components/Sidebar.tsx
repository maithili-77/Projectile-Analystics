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
  Compass,
  LogOut,
  LogIn,
  RotateCcw
} from 'lucide-react';
import { HealthStatus, UserProfile } from '../types';
import { GunLogo } from './GunLogo';

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
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
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
  currentUser,
  onOpenAuth,
  onLogout,
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
          <GunLogo size="sm" />
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            BALLASTIC PREDICTION SYSTEM
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
              className="flex items-center gap-3 cursor-pointer overflow-hidden group"
            >
              <GunLogo size="md" />
              {(!isCollapsed || isOpenMobile) && (
                <div className="truncate">
                  <div className="text-sm font-black tracking-wider text-slate-100 uppercase leading-snug">
                    BALLASTIC
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">PREDICTION SYSTEM</div>
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

          {/* Quick Action: Replay Cinematic Intro */}
          <div className="px-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpenMobile(false);
                window.dispatchEvent(new CustomEvent('replay_ballistic_intro'));
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 border border-transparent transition-all cursor-pointer ${
                isCollapsed && !isOpenMobile ? 'justify-center' : ''
              }`}
              title="Replay Cinematic Intro"
            >
              <RotateCcw className="w-4 h-4 shrink-0 text-cyan-400" />
              {(!isCollapsed || isOpenMobile) && <span className="truncate">Replay Intro</span>}
            </button>
          </div>
        </div>

        {/* User Account / Session Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          {currentUser ? (
            <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${isCollapsed && !isOpenMobile ? 'justify-center' : 'justify-between'}`}>
              <div
                onClick={onOpenAuth}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Click to view researcher account details"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentUser.avatarColor || 'from-cyan-500 to-indigo-600'} flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0`}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                {(!isCollapsed || isOpenMobile) && (
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono truncate" title={currentUser.email}>
                      {currentUser.email}
                    </div>
                  </div>
                )}
              </div>

              {(!isCollapsed || isOpenMobile) ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer shrink-0"
                  title="Sign Out / Switch Researcher Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(!isCollapsed || isOpenMobile) && (
                <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>Guest Access</span>
                  </span>
                  <span className="text-slate-500">Unsaved Session</span>
                </div>
              )}
              <button
                type="button"
                onClick={onOpenAuth}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${isCollapsed && !isOpenMobile ? 'justify-center' : ''}`}
                title="Sign In or Register to save your predictions"
              >
                <LogIn className="w-4 h-4 shrink-0 text-cyan-400" />
                {(!isCollapsed || isOpenMobile) && <span>Sign In / Register</span>}
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
