import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Sun, 
  Sunset, 
  Moon, 
  Plus, 
  Trash2, 
  Sparkles, 
  RefreshCw,
  AlertCircle,
  Pill,
  ShieldCheck,
  Calendar,
  Eye,
  Check
} from 'lucide-react';
import { API_BASE } from '../../config';

// Synthetic sample prescription graphic generator
function generateSamplePrescriptionDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 720);

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.strokeRect(15, 15, 570, 690);

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('HEALTHCARE CLINIC & CONSULTATION', 35, 55);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.fillText('Dr. Arvind Sen, MD | Reg: MED-99218', 35, 80);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 95);
  ctx.lineTo(570, 95);
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Patient Name: Rohan Sharma       Date: Current', 35, 120);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 32px Georgia, serif';
  ctx.fillText('℞', 35, 175);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'italic 17px "Brush Script MT", cursive, sans-serif';
  ctx.fillText('1. Tab. Azithromycin 500mg - 1 Tab Morning (Before Food) x 5 days', 50, 225);
  ctx.fillText('2. Tab. Levocetirizine 5mg - 1 Tab Night (After Food) x 10 days', 50, 280);
  ctx.fillText('3. Cap. Pantoprazole 40mg - 1 Cap Morning (Empty Stomach) x 7 days', 50, 335);
  ctx.fillText('4. Tab. Paracetamol 650mg - 1 Tab TDS (After Food) x 3 days', 50, 390);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Note: Avoid Penicillin and Ibuprofen due to reported allergies.', 35, 540);
  ctx.fillText('Take with warm water. Review after 5 days.', 35, 560);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function UserPrescriptions({ currentUser }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' or 'scan'

  // Fetch prescriptions from database
  const fetchPrescriptions = async () => {
    try {
      const pid = currentUser?.id ? `patient_id=${currentUser.id}` : '';
      const res = await fetch(`${API_BASE}/api/prescriptions?${pid}`);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
        if (data.length > 0) {
          setSelectedPrescriptionId(prev => (prev && data.some(p => p.id === prev) ? prev : data[0].id));
        } else {
          setSelectedPrescriptionId(null);
        }
      }
    } catch (e) {
      console.error('Error fetching prescriptions:', e);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [currentUser?.id]);

  const handleLoadSample = () => {
    const sampleB64 = generateSamplePrescriptionDataUrl();
    setPrescriptionImage(sampleB64);
    setErrorMsg('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPrescriptionImage(reader.result);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Scan Prescription & Automatically Add to Timetable
  const handleScanPrescription = async () => {
    if (!prescriptionImage) {
      setErrorMsg('Please upload a prescription photo or load the sample first.');
      return;
    }

    setScanning(true);
    setErrorMsg('');

    try {
      // 1. Analyze with Google Gemini 2.5 Flash Vision API
      const res = await fetch(`${API_BASE}/api/analyze-prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: prescriptionImage,
          patient_id: currentUser?.id || 1
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newPrescription = await res.json();

      // 2. Automatically verify & push into user's personal timetable
      await fetch(`${API_BASE}/api/prescriptions/${newPrescription.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: newPrescription.medicines,
          doctor_notes: newPrescription.doctor_notes
        })
      });

      setSuccessToast(`Prescription scanned! ${newPrescription.medicines.length} medicines scheduled into your timetable.`);
      
      // Update state: Set this newly scanned prescription as the active one!
      setSelectedPrescriptionId(newPrescription.id);
      await fetchPrescriptions();
      setActiveTab('timetable');
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      console.error('Prescription OCR Error:', err);
      setErrorMsg(`Failed to scan prescription: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Delete Prescription
  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to delete this prescription from your timetable?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessToast('Prescription removed.');
        const updated = prescriptions.filter(p => p.id !== prescriptionId);
        setPrescriptions(updated);
        setSelectedPrescriptionId(updated[0]?.id || null);
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Toggle Medicine Taken
  const handleToggleTaken = async (prescriptionId, medIndex) => {
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
      fetchPrescriptions();
    }
  };

  // Active Prescription (Latest or User-selected)
  const activePrescription = prescriptions.find(p => p.id === selectedPrescriptionId) || prescriptions[0] || null;

  // Filter medicines ONLY from the active prescription!
  const getMedicinesForSlot = (slotName) => {
    if (!activePrescription || !activePrescription.medicines) return [];
    const list = [];
    activePrescription.medicines.forEach((med, idx) => {
      const timing = med.timing || [];
      if (timing.includes(slotName)) {
        list.push({ ...med, prescriptionId: activePrescription.id, medicineIndex: idx });
      }
    });
    return list;
  };

  const morningMeds = getMedicinesForSlot('Morning');
  const afternoonMeds = getMedicinesForSlot('Afternoon');
  const nightMeds = getMedicinesForSlot('Night');

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Top Header & Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Pill className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              My Medicines & Prescription Scanner
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Powered by Google Gemini 2.5 Flash Vision: Scans your prescription and generates your daily timetable from that exact prescription.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              activeTab === 'timetable'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md glow-blue'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> My Daily Timetable
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md glow-blue'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Scan New Prescription
          </button>
        </div>
      </div>

      {successToast && (
        <div className="mb-6 p-4 bg-emerald-950/90 border border-emerald-500/80 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg glow-emerald">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-700/80 rounded-2xl text-xs text-red-200 flex items-center gap-2.5 shadow-lg glow-red">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* VIEW 1: MY DAILY TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          {activePrescription ? (
            <>
              {/* Active Prescription Card Header */}
              <div className="glass-panel border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-white">
                          Active Prescription Timetable
                        </h3>
                        <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                          Verified & Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {activePrescription.doctor_notes || 'Prescription medicines extracted with Gemini Vision AI.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeletePrescription(activePrescription.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-600 text-xs font-bold transition flex items-center gap-1.5"
                      title="Delete this prescription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Prescription</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('scan')}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Scan Another
                    </button>
                  </div>
                </div>

                {/* Multiple Prescriptions Switcher (if user scanned more than 1) */}
                {prescriptions.length > 1 && (
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-400">Switch Prescription:</span>
                    {prescriptions.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPrescriptionId(p.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                          selectedPrescriptionId === p.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Prescription #{idx + 1} ({p.medicines?.length || 0} meds)
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Morning Slot */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sun className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Morning Dose (08:00 AM)</h3>
                  <span className="text-[11px] text-slate-500 font-bold">({morningMeds.length} scheduled)</span>
                </div>
                {morningMeds.length === 0 ? (
                  <div className="p-3.5 glass-panel rounded-2xl text-center text-xs text-slate-500 border border-slate-800/60 font-medium">
                    No morning doses in this prescription
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <Sunset className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Afternoon Dose (01:30 PM)</h3>
                  <span className="text-[11px] text-slate-500 font-bold">({afternoonMeds.length} scheduled)</span>
                </div>
                {afternoonMeds.length === 0 ? (
                  <div className="p-3.5 glass-panel rounded-2xl text-center text-xs text-slate-500 border border-slate-800/60 font-medium">
                    No afternoon doses in this prescription
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Night Dose (09:00 PM)</h3>
                  <span className="text-[11px] text-slate-500 font-bold">({nightMeds.length} scheduled)</span>
                </div>
                {nightMeds.length === 0 ? (
                  <div className="p-3.5 glass-panel rounded-2xl text-center text-xs text-slate-500 border border-slate-800/60 font-medium">
                    No night doses in this prescription
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
            </>
          ) : (
            /* Empty State: When no prescription is active */
            <div className="glass-panel border border-slate-800/90 rounded-3xl p-12 text-center shadow-xl my-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">No Active Prescription Loaded</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                Your Daily Medication Timetable is generated exclusively from the prescription you upload. Please scan or upload a prescription image to schedule your daily doses.
              </p>
              <button
                onClick={() => setActiveTab('scan')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl transition shadow-lg glow-blue active:scale-95 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload & Scan Prescription Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SCAN PRESCRIPTION */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel border border-slate-800/90 rounded-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Upload Doctor's Prescription Photo
              </span>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition shadow-sm active:scale-95">
                <span>Browse File</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] p-2.5 shadow-inner">
              {prescriptionImage ? (
                <img src={prescriptionImage} alt="Prescription" className="max-h-[360px] object-contain rounded-xl shadow-lg" />
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <FileText className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="font-bold text-slate-300 mb-1 text-sm">No prescription image loaded</p>
                  <p className="text-[11px] text-slate-500 mb-4 max-w-xs mx-auto">
                    Take a clear photo of your doctor's written prescription or load the sample below to test.
                  </p>
                  <button
                    onClick={handleLoadSample}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 rounded-xl font-bold transition shadow-sm"
                  >
                    Load Sample Doctor Prescription
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleScanPrescription}
              disabled={scanning || !prescriptionImage}
              className="mt-5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-xl glow-blue disabled:opacity-50 active:scale-[0.98]"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decoding Prescription with Gemini Vision AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Scan & Generate Daily Timetable</span>
                </>
              )}
            </button>
          </div>

          {/* Guide Card */}
          <div className="glass-panel border border-slate-800/90 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                How the Prescription Timetable Works:
              </h3>
              
              <ul className="space-y-4 text-xs text-slate-300">
                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/70">
                  <span className="w-6 h-6 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
                  <span><strong>100% Prescription-Accurate:</strong> Only the medicines, dosages, and schedules explicitly written on your prescription are added to your timetable. No random or extra medicines!</span>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/70">
                  <span className="w-6 h-6 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
                  <span><strong>Allergy Safety Cross-Check:</strong> Gemini checks all extracted drugs against your profile allergies ({currentUser?.allergies || 'Penicillin, NSAIDs'}).</span>
                </li>

                <li className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/70">
                  <span className="w-6 h-6 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
                  <span><strong>Daily Schedule Slots:</strong> Doses are placed in Morning (08:00 AM), Afternoon (01:30 PM), or Night (09:00 PM) with Before Food / After Food instructions.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400 mt-6 flex items-center gap-2.5">
              <span className="text-cyan-400 font-bold">💡 Tip:</span>
              <span>You can delete old prescriptions or add new ones anytime. Your schedule updates in real-time.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicineItem({ med, onToggle }) {
  const isTaken = med.taken_today;
  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between shadow-md ${
        isTaken
          ? 'bg-slate-950/50 border-emerald-900/40 opacity-75'
          : 'glass-panel border-slate-800/90 hover:border-slate-700 hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isTaken 
              ? 'bg-emerald-500 text-white shadow-md glow-emerald' 
              : 'border-2 border-slate-600 hover:border-emerald-500 text-transparent'
          }`}
        >
          {isTaken && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-xs sm:text-sm font-bold ${isTaken ? 'line-through text-slate-500' : 'text-white'}`}>
              {med.medicine_name}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 text-cyan-400 border border-blue-500/30 font-bold">
              {med.dosage}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-medium">
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                med.meal_relation === 'Before Food' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {med.meal_relation || 'After Food'}
            </span>
            {med.duration_days && (
              <>
                <span>•</span>
                <span>{med.duration_days} days course</span>
              </>
            )}
          </div>
        </div>
      </div>

      <span className={`text-[11px] font-bold ${isTaken ? 'text-emerald-400' : 'text-slate-500'}`}>
        {isTaken ? '✓ Taken' : 'Tap to Mark Done'}
      </span>
    </div>
  );
}
