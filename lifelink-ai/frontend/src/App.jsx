import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  AlertTriangle, 
  Pill, 
  Activity, 
  LogOut, 
  User, 
  Heart, 
  MessageSquareQuote, 
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { API_BASE } from './config';

// Authentication
import AuthPage from './components/auth/AuthPage';

// 100% User-Centric Health & Emergency Suite
import UserSOS from './components/user/UserSOS';
import UserAIChat from './components/user/UserAIChat';
import UserPrescriptions from './components/user/UserPrescriptions';
import UserReportAnalyzer from './components/user/UserReportAnalyzer';
import UserMedicalID from './components/user/UserMedicalID';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lifelink_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Active Tab: 'sos' | 'chat' | 'prescriptions' | 'reports' | 'medical_id'
  const [activeTab, setActiveTab] = useState('sos');
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        setBackendOnline(res.ok);
      } catch (err) {
        setBackendOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('lifelink_user', JSON.stringify(user));
    setActiveTab('sos');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lifelink_user');
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-mesh-dark bg-grid-pattern text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top App Header */}
      <header className="glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-white/20 text-white shadow-lg">
              <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                LifeLink AI
              </span>
              <span className="flex items-center gap-1.5 text-[10px] bg-cyan-950/80 text-cyan-300 font-extrabold px-2.5 py-0.5 rounded-full border border-cyan-500/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
              <span>Personal Emergency & Google Gemini AI Health Companion</span>
            </p>
          </div>
        </div>

        {/* User Profile Badge & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl glass-panel border border-slate-700/60 shadow-lg hover:border-slate-600 transition">
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Heart className="w-3.5 h-3.5 fill-rose-500 animate-pulse" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-white tracking-tight leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Blood Group: <strong className="text-rose-400 font-bold">{currentUser.blood_group || 'O-Negative'}</strong>
              </span>
            </div>
            {currentUser.blood_group && (
              <span className="text-[10px] font-black bg-rose-600/30 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-lg sm:hidden shadow-sm">
                {currentUser.blood_group}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/50 text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Navigation Floating Pill Bar */}
      <nav className="glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-2 sticky top-[57px] z-40 backdrop-blur-2xl shadow-xl overflow-x-auto">
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 max-w-5xl mx-auto w-full">
          <button
            onClick={() => setActiveTab('sos')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === 'sos'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg glow-red scale-[1.02]'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeTab === 'sos' ? 'text-white animate-bounce' : 'text-rose-400'}`} />
            <span>1. Emergency SOS</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg glow-cyan scale-[1.02]'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <MessageSquareQuote className={`w-4 h-4 ${activeTab === 'chat' ? 'text-white' : 'text-cyan-400'}`} />
            <span>2. AI Health Chat (Gemini 2.5)</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === 'prescriptions'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue scale-[1.02]'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <Pill className={`w-4 h-4 ${activeTab === 'prescriptions' ? 'text-white' : 'text-blue-400'}`} />
            <span>3. Medicines & Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg glow-emerald scale-[1.02]'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-emerald-400'}`} />
            <span>4. Blood Report AI</span>
          </button>

          <button
            onClick={() => setActiveTab('medical_id')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === 'medical_id'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg glow-purple scale-[1.02]'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'medical_id' ? 'text-white' : 'text-purple-400'}`} />
            <span>5. Medical ID Card</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {activeTab === 'sos' && <UserSOS currentUser={currentUser} />}
        {activeTab === 'chat' && <UserAIChat currentUser={currentUser} />}
        {activeTab === 'prescriptions' && <UserPrescriptions currentUser={currentUser} />}
        {activeTab === 'reports' && <UserReportAnalyzer />}
        {activeTab === 'medical_id' && (
          <UserMedicalID currentUser={currentUser} onProfileUpdated={handleProfileUpdated} />
        )}
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="sm:hidden glass-panel border-t border-slate-800/90 p-2 grid grid-cols-5 gap-1.5 sticky bottom-0 z-40 shadow-2xl backdrop-blur-2xl">
        <button
          onClick={() => setActiveTab('sos')}
          className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
            activeTab === 'sos' ? 'text-white bg-rose-600 shadow-md glow-red' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mb-0.5" />
          <span>SOS</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
            activeTab === 'chat' ? 'text-white bg-cyan-600 shadow-md glow-cyan' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4 mb-0.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
            activeTab === 'prescriptions' ? 'text-white bg-blue-600 shadow-md glow-blue' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Pill className="w-4 h-4 mb-0.5" />
          <span>Meds</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
            activeTab === 'reports' ? 'text-white bg-emerald-600 shadow-md glow-emerald' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Report</span>
        </button>

        <button
          onClick={() => setActiveTab('medical_id')}
          className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-bold transition ${
            activeTab === 'medical_id' ? 'text-white bg-purple-600 shadow-md glow-purple' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>ID</span>
        </button>
      </div>
    </div>
  );
}
