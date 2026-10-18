import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { api } from './services/api';
import { HealthStatus } from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    api.getHealth()
      .then(res => setHealth(res))
      .catch(err => console.error('API health check error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-cyan-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        health={health}
        loading={loading}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between min-w-0 overflow-x-hidden">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'home' && <HomePage setActivePage={setActivePage} health={health} />}
          {activePage === 'calculator' && <CalculatorPage setActivePage={setActivePage} />}
          {activePage === 'simulator' && <SimulatorPage />}
          {activePage === 'history' && <HistoryPage />}
          {activePage === 'about' && <AboutPage />}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default App;
