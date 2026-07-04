import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

// Declare Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: string | number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  type: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserType, token: string) => void;
  onToggleType: (newType: 'login' | 'signup') => void;
}

export default function AuthModal({
  type,
  onClose,
  onSuccess,
  onToggleType,
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('pet_owner');
  
  // Tab panels in signup
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Google OAuth
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          role: type === 'signup' ? role : undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Cannot reach the server. Please try again later.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      // Successful Google auth
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [onClose, onSuccess, role, type]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isForgotPassword) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: type === 'login' ? 'signin_with' : 'signup_with',
        shape: 'pill',
        logo_alignment: 'center',
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogle();
          clearInterval(checkInterval);
        }
      }, 200);

      const timeout = setTimeout(() => clearInterval(checkInterval), 10000);
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [type, GOOGLE_CLIENT_ID, isForgotPassword, handleGoogleCredentialResponse]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Both Email and a New Password are required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset request failed.');
      }
      setResetFinished(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const apiBase = (import.meta as any).env?.VITE_API_URL || '';
    const url = type === 'login' ? `${apiBase}/api/auth/login` : `${apiBase}/api/auth/signup`;
    const payload = type === 'login' 
      ? { email, password }
      : { email, name, password, role, phone };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Cannot reach the server. Please try again later.');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication process failed.');
      }
      // Successful login/signup
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-green-50 flex flex-col">
        {/* Title panel */}
        <div className="bg-gradient-to-r from-[#58B368] to-[#BFE7C4] px-6 py-5 text-white relative">
          <h3 className="font-display font-black text-xl">
            {isForgotPassword 
              ? 'Reset Account Password' 
              : type === 'login' ? 'Welcome Back!' : 'Join the QuickVet Clan'}
          </h3>
          <p className="text-white/80 text-xs mt-0.5">
            {isForgotPassword 
              ? 'Set your convenient passcode' 
              : type === 'login' ? 'Book diagnostics and track care histories' : 'Get direct veterinary clinics alert linkages'}
          </p>
          <button
            onClick={onClose}
            className="absolute top-5 right-4 p-1.5 bg-black/10 hover:bg-black/25 rounded-xl text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message slot */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>&#9888;&#65039; {errorMsg}</span>
          </div>
        )}

        {/* Password reset visual state finished */}
        {isForgotPassword && resetFinished ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-gray-800 text-lg">Password Changed Successfully!</h4>
            <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto">
              Your passcode was updated. Try log in using your updated credentials right away.
            </p>
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setResetFinished(false);
                onToggleType('login');
              }}
              className="w-full py-3 bg-[#58B368] text-white font-extrabold rounded-xl text-sm capitalize"
            >
              Sign In Now Offer
            </button>
          </div>
        ) : isForgotPassword ? (
          /* Forgot password form */
          <form onSubmit={handleResetPassword} className="p-6 space-y-4.5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Account Registered Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 font-display">New Desired Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#58B368] text-white font-black rounded-xl text-sm scale-transition hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Updating Credentials...' : 'Save Updated Password'}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-center text-xs text-gray-500 font-bold hover:underline"
            >
              Back to Login Sign In
            </button>
          </form>
        ) : (
          /* Primary Auth Form (Login vs. Signup) */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* SEGMENTED CLIENT CONTROL FOR SIGNUP */}
            {type === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">You are a...</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRole('pet_owner')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      role === 'pet_owner'
                        ? 'bg-[#58B368] text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Pet Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('veterinarian')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      role === 'veterinarian'
                        ? 'bg-[#58B368] text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Veterinarian
                  </button>
                </div>
              </div>
            )}

            {/* GOOGLE SIGN-IN BUTTON */}
            {GOOGLE_CLIENT_ID && (
              <div className="space-y-3">
                <div ref={googleButtonRef} className="w-full flex justify-center [&>div]:!w-full" />
                
                {/* Divider */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or continue with email</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>
            )}

            {/* Fallback Google button when GSI script hasn't loaded or client ID not set */}
            {!GOOGLE_CLIENT_ID && (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Sign-In (Configure GOOGLE_CLIENT_ID)
                </button>
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">sign in with email</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>
            )}

            {/* FULL NAME */}
            {type === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prabal Beas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. prabal.beas2@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* PHONE FOR VET */}
            {type === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Emergency Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                  />
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}

            {type === 'signup' && role === 'veterinarian' && (
              <div className="rounded-2xl border border-green-100 bg-green-50/70 p-3 text-xs text-green-800 leading-relaxed">
                After signup, you will complete the mandatory Professional Verification Form for your own clinic or hospital. Your dashboard stays locked until an admin approves your credentials.
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Account Passcode</label>
                {type === 'login' && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-[#58B368] font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-[#58B368] hover:bg-green-600 active:scale-95 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-green-100 transition-all text-center cursor-pointer mt-4"
            >
              {loading 
                ? 'Processing verification...' 
                : type === 'login' ? 'Let me into QuickVet' : role === 'veterinarian' ? 'Continue to verification' : 'Unlock my companion account'}
            </button>

            {/* SWITCH TOGGLE */}
            <div className="pt-3 border-t text-center">
              <span className="text-xs text-gray-500">
                {type === 'login' ? "Don't have an account on QuickVet yet? " : 'Already registered with us before? '}
              </span>
              <button
                type="button"
                onClick={() => onToggleType(type === 'login' ? 'signup' : 'login')}
                className="text-xs text-[#58B368] font-bold hover:underline"
              >
                {type === 'login' ? 'Register Now' : 'Sign In Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
