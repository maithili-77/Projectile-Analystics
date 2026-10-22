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
      className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-black select-none overflow-hidden"
    >
      {/* Subtle ambient tech background glow matching the UI and logo */}
      <div className="absolute inset-0 bg-slate-950 -z-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Floating high-tech Skip button matching UI design */}
      <button
        onClick={handleFinish}
        id="skip-intro-btn"
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30 px-3.5 sm:px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono font-medium shadow-xl shadow-black/60 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md active:scale-95 group"
        title="Skip Intro (Escape or Space)"
      >
        <span className="tracking-wider">SKIP INTRO</span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 group-hover:text-cyan-400 border border-slate-700/80 group-hover:border-cyan-500/30">
          ESC
        </span>
        <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
      </button>

      {/* Fullscreen Video Viewport - seamless edge-to-edge */}
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
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
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 cursor-pointer z-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform border border-cyan-400/40">
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 tracking-wider font-mono">INITIALIZE INTRO</p>
              <p className="text-xs text-slate-400 font-mono mt-1">Click anywhere to play video with audio</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
