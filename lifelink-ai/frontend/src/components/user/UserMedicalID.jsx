import React, { useState } from 'react';
import { 
  User, 
  Heart, 
  ShieldAlert, 
  Phone, 
  Save, 
  CheckCircle2, 
  Download, 
  Printer, 
  AlertCircle,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function UserMedicalID({ currentUser, onProfileUpdated }) {
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Rohan Sharma',
    age: currentUser?.age || 24,
    blood_group: currentUser?.blood_group || 'O-Negative',
    allergies: currentUser?.allergies || 'Penicillin, NSAIDs (Ibuprofen)',
    chronic_conditions: currentUser?.chronic_conditions || 'Asthma, Mild Hypertension',
    medications: currentUser?.medications || 'Salbutamol Inhaler',
    emergency_contact: currentUser?.emergency_contact || '+91-9876543210 (Father)'
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast('');

    try {
      const res = await fetch(`${API_BASE}/api/profile?patient_id=${currentUser?.id || 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        const data = await res.json();
        const updated = { ...currentUser, ...data.profile };
        localStorage.setItem('lifelink_user', JSON.stringify(updated));
        if (onProfileUpdated) onProfileUpdated(updated);
        setToast('Medical ID updated successfully!');
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <User className="w-6 h-6 text-rose-500" />
            My Emergency Medical ID Card & Profile
          </h1>
          <p className="text-xs text-slate-400">
            Keep your critical medical information updated for first responders and family emergency contacts.
          </p>
        </div>

        <button
          onClick={handlePrintCard}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          Print / Save PDF Card
        </button>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-emerald-950/90 border border-emerald-500/80 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Digital Emergency ID Card Preview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl glow-red mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-rose-500/20 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center font-black text-xl shadow-lg glow-red border border-white/20">
              <Heart className="w-6 h-6 fill-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest block mb-0.5">
                Official LifeLink Medical Passport • ICE Verified
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">{profileForm.name}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Blood Group</span>
            <span className="text-xl font-black text-rose-400 bg-rose-950/90 border border-rose-500 px-3.5 py-1 rounded-2xl inline-block mt-0.5 shadow-md">
              {profileForm.blood_group}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs relative z-10">
          <div className="glass-panel p-3.5 rounded-2xl border border-rose-900/40 shadow-inner">
            <span className="text-[10px] text-rose-400 uppercase font-black block mb-1">
              ⚠️ Critical Drug Allergies
            </span>
            <span className="text-rose-200 font-bold text-xs">{profileForm.allergies || 'None'}</span>
          </div>
          <div className="glass-panel p-3.5 rounded-2xl border border-amber-900/40 shadow-inner">
            <span className="text-[10px] text-amber-400 uppercase font-black block mb-1">
              Chronic Conditions
            </span>
            <span className="text-amber-200 font-bold text-xs">{profileForm.chronic_conditions || 'None'}</span>
          </div>
          <div className="glass-panel p-3.5 rounded-2xl border border-cyan-900/40 shadow-inner">
            <span className="text-[10px] text-cyan-400 uppercase font-black block mb-1">
              Emergency ICE Contact
            </span>
            <span className="text-cyan-200 font-bold text-xs">{profileForm.emergency_contact || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="glass-panel border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-rose-400" />
          Update Medical Profile Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
            <select
              value={profileForm.blood_group}
              onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500"
            >
              <option value="O-Negative">O-Negative</option>
              <option value="O-Positive">O-Positive</option>
              <option value="A-Positive">A-Positive</option>
              <option value="A-Negative">A-Negative</option>
              <option value="B-Positive">B-Positive</option>
              <option value="B-Negative">B-Negative</option>
              <option value="AB-Positive">AB-Positive</option>
              <option value="AB-Negative">AB-Negative</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-rose-400 mb-1">
              Critical Drug Allergies (Life-Threatening)
            </label>
            <input
              type="text"
              value={profileForm.allergies}
              onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
              placeholder="e.g. Penicillin, NSAIDs (Ibuprofen)"
              className="w-full bg-slate-950 border border-rose-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Chronic Medical Conditions
            </label>
            <input
              type="text"
              value={profileForm.chronic_conditions}
              onChange={(e) => setProfileForm({ ...profileForm, chronic_conditions: e.target.value })}
              placeholder="e.g. Asthma, Hypertension, Diabetes"
              className="w-full bg-slate-950 border border-amber-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ongoing Medications
            </label>
            <input
              type="text"
              value={profileForm.medications}
              onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
              placeholder="e.g. Salbutamol Inhaler, Metformin"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="text"
              value={profileForm.emergency_contact}
              onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
              placeholder="e.g. +91-9876543210 (Father)"
              className="w-full bg-slate-950 border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md glow-red disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save & Update Medical ID
            </>
          )}
        </button>
      </form>
    </div>
  );
}
