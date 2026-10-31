import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sun, 
  Sunset, 
  Moon, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function PatientReminders() {
  const [activeTab, setActiveTab] = useState('timetable'); // timetable | profile
  const [prescriptions, setPrescriptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    blood_group: 'O-Negative',
    allergies: '',
    chronic_conditions: '',
    medications: '',
    emergency_contact: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Fetch verified prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prescriptions?verified_only=true`);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      }
    } catch (e) {
      console.error('Error fetching prescriptions:', e);
    }
  };

  // Fetch patient profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({
          name: data.name || '',
          age: data.age || '',
          blood_group: data.blood_group || 'O-Negative',
          allergies: data.allergies || '',
          chronic_conditions: data.chronic_conditions || '',
          medications: data.medications || '',
          emergency_contact: data.emergency_contact || ''
        });
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchProfile();
  }, []);

  const handleToggleTaken = async (prescriptionId, medIndex) => {
    // Optimistic UI update
    setPrescriptions((prev) =>
      prev.map((pres) => {
        if (pres.id === prescriptionId) {
          const updatedMeds = [...pres.medicines];
          updatedMeds[medIndex] = {
            ...updatedMeds[medIndex],
            taken_today: !updatedMeds[medIndex].taken_today
          };
          return { ...pres, medicines: updatedMeds };
        }
        return pres;
      })
    );

    try {
      await fetch(`${API_BASE}/api/prescriptions/${prescriptionId}/toggle-taken?medicine_index=${medIndex}`, {
        method: 'PUT'
      });
    } catch (e) {
      console.error('Error syncing taken state:', e);
      fetchPrescriptions(); // revert on fail
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile?patient_id=1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSuccessToast('Patient profile updated and synced with ER dispatcher!');
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Group medicines by slot
  const getAllMedicinesForSlot = (slotName) => {
    const list = [];
    prescriptions.forEach((pres) => {
      (pres.medicines || []).forEach((med, idx) => {
        const timing = med.timing || [];
        if (timing.includes(slotName)) {
          list.push({ ...med, prescriptionId: pres.id, medicineIndex: idx });
        }
      });
    });
    return list;
  };

  const morningMeds = getAllMedicinesForSlot('Morning');
  const afternoonMeds = getAllMedicinesForSlot('Afternoon');
  const nightMeds = getAllMedicinesForSlot('Night');

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Subtab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'timetable'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Medicine Timetable
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Medical ID Profile
          </button>
        </div>

        <button
          onClick={() => {
            fetchPrescriptions();
            fetchProfile();
          }}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/80 transition"
          title="Refresh Reminders"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {successToast && (
        <div className="mx-4 mt-3 p-3 bg-emerald-950/90 border border-emerald-600/70 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* TIMETABLE VIEW */}
      {activeTab === 'timetable' && (
        <div className="p-4 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Doctor-Verified Timetable
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prescriptions verified by hospital physicians appear here with scheduled dosage.
              </p>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2.5 py-1 rounded-full">
              {prescriptions.length} Active
            </span>
          </div>

          {/* Morning Slot */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Sun className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Morning (08:00 AM)</h3>
              <span className="text-[11px] text-slate-500">({morningMeds.length} meds)</span>
            </div>
            {morningMeds.length === 0 ? (
              <div className="p-3 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 border border-slate-800/50">
                No morning doses scheduled
              </div>
            ) : (
              morningMeds.map((med, idx) => (
                <MedicineItem
                  key={`m-${idx}`}
                  med={med}
                  onToggle={() => handleToggleTaken(med.prescriptionId, med.medicineIndex)}
                />
              ))
            )}
          </div>

          {/* Afternoon Slot */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400">
              <Sunset className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Afternoon (01:30 PM)</h3>
              <span className="text-[11px] text-slate-500">({afternoonMeds.length} meds)</span>
            </div>
            {afternoonMeds.length === 0 ? (
              <div className="p-3 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 border border-slate-800/50">
                No afternoon doses scheduled
              </div>
            ) : (
              afternoonMeds.map((med, idx) => (
                <MedicineItem
                  key={`a-${idx}`}
                  med={med}
                  onToggle={() => handleToggleTaken(med.prescriptionId, med.medicineIndex)}
                />
              ))
            )}
          </div>

          {/* Night Slot */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Moon className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Night (09:00 PM)</h3>
              <span className="text-[11px] text-slate-500">({nightMeds.length} meds)</span>
            </div>
            {nightMeds.length === 0 ? (
              <div className="p-3 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 border border-slate-800/50">
                No night doses scheduled
              </div>
            ) : (
              nightMeds.map((med, idx) => (
                <MedicineItem
                  key={`n-${idx}`}
                  med={med}
                  onToggle={() => handleToggleTaken(med.prescriptionId, med.medicineIndex)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* PROFILE VIEW */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold text-sm">
              <User className="w-4 h-4" />
              <span>LifeLink Emergency Medical ID Profile</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              These details are immediately broadcast to hospital emergency rooms during an SOS alert.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={profileForm.blood_group}
                    onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1">
                  Critical Drug Allergies (Life-Threatening)
                </label>
                <input
                  type="text"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, NSAIDs (Ibuprofen), Sulfa drugs"
                  className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
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
                  placeholder="e.g. Asthma, Hypertension, Diabetes Type 2"
                  className="w-full bg-slate-950 border border-amber-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ongoing Medications
                </label>
                <input
                  type="text"
                  value={profileForm.medications}
                  onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
                  placeholder="e.g. Salbutamol Inhaler, Metformin 500mg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1">
                  Emergency ICE Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  value={profileForm.emergency_contact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                  placeholder="e.g. +91-9876543210 (Dr. Sharma / Father)"
                  className="w-full bg-slate-950 border border-cyan-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save & Update Medical ID
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MedicineItem({ med, onToggle }) {
  const isTaken = med.taken_today;
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
        isTaken
          ? 'bg-slate-900/50 border-emerald-900/40 opacity-70'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition ${
            isTaken
              ? 'bg-emerald-500 text-white'
              : 'border-2 border-slate-600 hover:border-emerald-500'
          }`}
        >
          {isTaken && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-xs font-bold ${isTaken ? 'line-through text-slate-400' : 'text-white'}`}>
              {med.medicine_name}
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>Dosage: <strong className="text-slate-200">{med.dosage}</strong></span>
            <span>•</span>
            <span
              className={`px-1.5 py-0.2 rounded font-medium ${
                med.meal_relation === 'Before Food'
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'bg-blue-500/10 text-blue-300'
              }`}
            >
              {med.meal_relation || 'After Food'}
            </span>
            {med.duration_days && (
              <>
                <span>•</span>
                <span>{med.duration_days} days</span>
              </>
            )}
          </div>
        </div>
      </div>

      <span className={`text-[11px] font-semibold ${isTaken ? 'text-emerald-400' : 'text-slate-500'}`}>
        {isTaken ? 'Taken' : 'Pending'}
      </span>
    </div>
  );
}
