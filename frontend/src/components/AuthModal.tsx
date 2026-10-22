import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Compass,
  ArrowRight,
  Fingerprint,
  Zap,
  Target
} from 'lucide-react';
import { loginUser, signupUser } from '../utils/auth';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  onContinueGuest?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onSuccess,
  onClose,
  onContinueGuest,
  canDismiss = false
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Ballistics Researcher');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGuestClick = () => {
    if (onContinueGuest) {
      onContinueGuest();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const result = loginUser(email, password);
        if (result.success && result.user) {
          onSuccess(result.user);
        } else {
          setError(result.error || 'Authentication failed. Please verify credentials.');
        }
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please re-enter your password.');
          setLoading(false);
          return;
        }
        const result = signupUser(name, email, password, role);
        if (result.success && result.user) {
          onSuccess(result.user);
        } else {
          setError(result.error || 'Failed to register account.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop with high-tech blur and grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={canDismiss ? onClose : handleGuestClick}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl -z-10"
        />

        {/* Ambient glowing radial effects */}
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/3 w-[500px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl rounded-2xl glass-card border border-slate-700/80 bg-slate-900/90 shadow-2xl overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-b from-slate-800/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-glow-cyan">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-100 tracking-wider uppercase flex items-center gap-2">
                    <span>BALLASTIX</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      SECURE LAB
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {mode === 'LOGIN' ? 'Sign in to access personalized prediction sessions' : 'Create a researcher profile to store prediction history'}
                  </p>
                </div>
              </div>

              {/* Guest option in header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGuestClick}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Use the platform as Guest without logging in"
                >
                  <span>Use as Guest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {(canDismiss || onClose) && (
                  <button
                    type="button"
                    onClick={handleGuestClick}
                    className="text-slate-400 hover:text-slate-200 text-xs font-mono p-1 rounded-lg hover:bg-slate-800"
                    title="Close"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 mt-6 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setError(null); }}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'LOGIN'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('SIGNUP'); setError(null); }}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'SIGNUP'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {mode === 'SIGNUP' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Researcher Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@research.lab"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-colors"
              />
            </div>

            {mode === 'SIGNUP' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research Specialization / Role</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-colors"
                >
                  <option value="Ballistics Researcher">Ballistics Researcher</option>
                  <option value="Armor Protection Specialist">Armor Protection Specialist</option>
                  <option value="Computational Physicist">Computational Physicist</option>
                  <option value="Machine Learning Scientist">Machine Learning Scientist</option>
                  <option value="Academic Investigator">Academic Investigator</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'SIGNUP' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-colors font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg ${
                mode === 'LOGIN'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/20'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'LOGIN' ? 'Sign In to Workspace' : 'Complete Registration & Open Lab'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Prominent option to use website without login */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                OR
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGuestClick}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 bg-slate-950/90 hover:bg-slate-800/90 text-slate-200 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 shadow-md group active:scale-98"
            >
              <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>Continue Without Login (Guest Access)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </button>

            {/* Bottom info notice */}
            <div className="pt-2 border-t border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-500 font-mono">
                🔒 Sign in anytime to permanently save and separate prediction history per researcher email.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
