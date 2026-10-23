import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { AuthModal } from './components/AuthModal';
import { IntroAnimation } from './components/IntroAnimation';
import { api } from './services/api';
import { HealthStatus, UserProfile } from './types';
import { getCurrentUser, logoutUser } from './utils/auth';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Show 4-second cinematic intro animation on application load
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ballastix_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Listen for replay requests from sidebar or other components
  useEffect(() => {
    const handleReplay = () => {
      setShowIntro(true);
    };
    window.addEventListener('replay_ballistic_intro', handleReplay);
    return () => window.removeEventListener('replay_ballistic_intro', handleReplay);
  }, []);

  // If user is not logged in and not in guest mode, show auth modal once intro completes
  useEffect(() => {
    if (!showIntro && !currentUser && !isGuestMode) {
      setShowAuthModal(true);
    }
  }, [showIntro, currentUser, isGuestMode]);

  // Synchronize authentication changes across components
  useEffect(() => {
    const handleAuthChange = () => {
      const u = getCurrentUser();
      setCurrentUser(u);
      if (u) {
        setIsGuestMode(false);
      }
    };
    window.addEventListener('ballastix_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ballastix_auth_changed', handleAuthChange);
  }, []);

  useEffect(() => {
    api.getHealth()
      .then(res => setHealth(res))
      .catch(err => console.error('API health check error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleContinueGuest = () => {
    setIsGuestMode(true);
    try {
      sessionStorage.setItem('ballastix_guest_mode', 'true');
    } catch {}
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsGuestMode(false);
    try {
      sessionStorage.removeItem('ballastix_guest_mode');
    } catch {}
    setShowAuthModal(true);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem('ballistic_analyst_intro_seen', 'true');
    } catch {}
    if (!currentUser && !isGuestMode) {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      {/* Premium Cinematic Intro Animation */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* Login and Signup Modal with prominent Guest option */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={(user) => {
          setIsGuestMode(false);
          try {
            sessionStorage.removeItem('ballastix_guest_mode');
          } catch {}
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
        onClose={() => setShowAuthModal(false)}
        onContinueGuest={handleContinueGuest}
        canDismiss={!!currentUser || isGuestMode}
      />

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
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between min-w-0 overflow-x-hidden">
          <main className="px-3 py-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activePage === 'home' && <HomePage setActivePage={setActivePage} health={health} />}
            {activePage === 'calculator' && <CalculatorPage setActivePage={setActivePage} />}
            {activePage === 'simulator' && <SimulatorPage />}
            {activePage === 'history' && <HistoryPage setActivePage={setActivePage} />}
            {activePage === 'about' && <AboutPage />}
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default App;


