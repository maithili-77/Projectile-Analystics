import React, { useState, useRef, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<Props> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoplayFailed, setAutoplayFailed] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    try {
      sessionStorage.setItem('ballistix_intro_seen', 'true');
    } catch {
      // Ignore storage errors if disabled
    }
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  // Keyboard shortcut listener (Escape or Space to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Attempt autoplay on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay restricted by browser:', err);
        setAutoplayFailed(true);
      });
    }
  }, []);

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.play().then(() => setAutoplayFailed(false)).catch(console.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F7F5F0] p-4 sm:p-8 select-none overflow-hidden"
    >
      {/* Warm light background pattern and subtle ambient glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#FFF0E2] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating minimal Skip button */}
      <button
        onClick={handleFinish}
        id="skip-intro-btn"
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FFF9F1] border border-[#E5E1DA] hover:border-[#FF8A24] text-[#172536] hover:text-[#FF8A24] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm active:scale-95"
        title="Skip Intro (Escape)"
      >
        <span>Skip</span>
        <X className="w-3.5 h-3.5 text-[#FF8A24]" />
      </button>

      {/* Fullscreen Video Pop-up Viewport - ONLY the gun video */}
      <div className="relative w-full max-w-5xl max-h-[85vh] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#E5E1DA] bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src="/intro.mp4"
          playsInline
          autoPlay
          muted
          onEnded={handleFinish}
          className="w-full h-full object-contain block"
        />

        {/* Autoplay fallback if browser policy blocks autoplay */}
        {autoplayFailed && (
          <div
            onClick={handleManualPlay}
            className="absolute inset-0 bg-[#F7F5F0]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-[#FF8A24] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <p className="text-xs font-bold text-[#172536]">Click to Play Intro</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
