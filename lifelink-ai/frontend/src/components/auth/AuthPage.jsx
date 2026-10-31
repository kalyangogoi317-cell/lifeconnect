import React, { useState } from 'react';
import { 
  HeartPulse, 
  User, 
  Mail, 
  Lock, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  Heart, 
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function AuthPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    age: 24,
    blood_group: 'O-Negative',
    allergies: '',
    chronic_conditions: '',
    emergency_contact: ''
  });

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Please check credentials.');
      }

      setSuccessMsg(`Welcome, ${data.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setErrorMsg('Please enter your full name, email, and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Sign up failed. Please try a different email.');
      }

      setSuccessMsg('Account created successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setAuthMode('login');
    setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          onLoginSuccess(data.user);
        } else {
          setErrorMsg(data.detail || 'Quick login failed');
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-xl glow-red mb-3">
          <HeartPulse className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          LifeLink AI
          <span className="text-xs bg-rose-500/20 text-rose-400 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30 uppercase">
            Personal Health
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Your Personal AI Health Companion: Emergency SOS, Prescription Scanner, Lab Report Simplifier & Emergency Medical ID.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-rose-600 text-white shadow-md glow-red'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Create Account (Sign Up)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-blue-600 text-white shadow-md glow-blue'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Medical ID Section */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Your Personal Emergency Medical Profile
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={signupForm.blood_group}
                    onChange={(e) => setSignupForm({ ...signupForm, blood_group: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="O-Negative">O-Negative (Universal Donor)</option>
                    <option value="O-Positive">O-Positive</option>
                    <option value="A-Positive">A-Positive</option>
                    <option value="A-Negative">A-Negative</option>
                    <option value="B-Positive">B-Positive</option>
                    <option value="B-Negative">B-Negative</option>
                    <option value="AB-Positive">AB-Positive</option>
                    <option value="AB-Negative">AB-Negative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={signupForm.age}
                    onChange={(e) => setSignupForm({ ...signupForm, age: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-400 mb-1">
                  Drug Allergies (e.g. Penicillin, Ibuprofen, None)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, NSAIDs, None"
                  value={signupForm.allergies}
                  onChange={(e) => setSignupForm({ ...signupForm, allergies: e.target.value })}
                  className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cyan-400 mb-1">
                  Emergency Contact Phone (Family / ICE)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91-9876543210 (Father / Sister)"
                  value={signupForm.emergency_contact}
                  onChange={(e) => setSignupForm({ ...signupForm, emergency_contact: e.target.value })}
                  className="w-full bg-slate-900 border border-cyan-900/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg glow-red disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating Your LifeLink Account...
                </>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg glow-blue disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In to LifeLink</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Login */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 mb-2 block text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick 1-Click Demo Login:
              </span>
              <button
                type="button"
                onClick={() => quickDemoLogin('rohan@lifelink.ai', 'password123')}
                className="w-full bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 p-2.5 rounded-xl text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white leading-tight">Demo User Account</span>
                    <span className="text-[10px] text-slate-400">Rohan Sharma (O-Negative, Asthma)</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-rose-400">Click to Log In →</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 text-[11px] text-slate-500 text-center">
        LifeLink AI — 100% Private, User-Centric Healthcare Companion
      </div>
    </div>
  );
}
