import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { AuthUser, UserSettings } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { auth } from '../lib/firebase';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser, initialSettings?: Partial<UserSettings>) => void;
  settings: UserSettings;
  onCancel?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  settings,
  onCancel,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status and feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDark = settings.darkMode;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // Basic client validations
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        // --- Firebase Sign In ---
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        // Fetch or initialize Firestore user profile
        // Get the display name from Firebase Authentication
        const displayName =
          fbUser.displayName ||
          cleanEmail.split('@')[0].replace(/[._-]/g, ' ') ||
          'User';

        const user: AuthUser = {
          id: fbUser.uid,
          name: displayName,
          email: fbUser.email || cleanEmail,
          currency: settings.currency || 'USD',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        };

        onLoginSuccess(user);
      } else {
        // --- Firebase Sign Up ---
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        // Update profile display name
        if (name.trim()) {
          try {
            await updateProfile(fbUser, { displayName: name.trim() });
          } catch (pErr) {
            console.warn('Profile update warning:', pErr);
          }
        }

        setPassword('');
        setMode('signin');
        setSuccessMessage('Account created successfully in Firebase! Please sign in with your password to continue.');
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      let msg = 'Authentication failed. Please verify your credentials.';
      if (errObj?.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (errObj?.code === 'auth/wrong-password' || errObj?.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check and try again.';
      } else if (errObj?.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (errObj?.message) {
        msg = errObj.message;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="northlight-auth-page"
      className={`min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'bg-[#0c0e14] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'
      }`}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-[#1e202a] dark:bg-white text-white dark:text-slate-950 font-bold text-2xl shadow-lg mb-2">
            N
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'signin' ? 'Welcome to Northlight' : 'Create your Northlight account'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {mode === 'signin'
              ? 'Sign in to access your ledger, recurring payments & analytics'
              : 'Sign up to start tracking your daily expenses & recurrent bills'}
          </p>
        </div>

        {/* Auth Card */}
        <div
          className={`rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${
            isDark
              ? 'bg-[#151821] border-slate-800 shadow-slate-950/50'
              : 'bg-white border-slate-200/80 shadow-slate-200/60'
          }`}
        >
          {/* Mode Switcher Tabs */}
          <div
            className={`p-1 rounded-2xl border flex items-center mb-6 transition-colors ${
              isDark ? 'bg-[#1c202d] border-slate-700/80' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? isDark
                    ? 'bg-[#2b3145] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? isDark
                    ? 'bg-[#2b3145] text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Success Banner (e.g. after sign up, prompt to confirm email) */}
          {successMessage && (
            <div
              id="auth-success-banner"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Registration Successful</p>
                <p className="mt-0.5 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name for Sign Up */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-fullname-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Full Name
                </label>
                <div
                  className={`flex items-center px-3.5 py-2.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-[#1c202d] border-slate-700/80 focus-within:border-indigo-500'
                      : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
                  }`}
                >
                  <User size={16} className="text-slate-400 mr-2.5 shrink-0" />
                  <input
                    id="auth-fullname-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full text-xs sm:text-sm font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
              >
                Email Address
              </label>
              <div
                className={`flex items-center px-3.5 py-2.5 rounded-2xl border transition-colors ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700/80 focus-within:border-indigo-500'
                    : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
                }`}
              >
                <Mail size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs sm:text-sm font-medium focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
              >
                Password
              </label>
              <div
                className={`flex items-center px-3.5 py-2.5 rounded-2xl border transition-colors ${
                  isDark
                    ? 'bg-[#1c202d] border-slate-700/80 focus-within:border-indigo-500'
                    : 'bg-[#f8f9fc] border-slate-200 focus-within:border-indigo-600'
                }`}
              >
                <Lock size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs sm:text-sm font-medium focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember this device</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Simple Error Handling Under the Form */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle size={17} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-800 dark:text-rose-200">Authentication Error</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Your expenses, recurrent payments, and budget limits are private to your authenticated account.
            </p>
          </div>

          {/* Cancel button if opened as optional dialog */}
          {onCancel && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
