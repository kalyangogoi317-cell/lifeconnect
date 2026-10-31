import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  Send, 
  AlertCircle, 
  RefreshCw,
  Eye,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { API_BASE } from '../../config';

// Synthetic sample prescription graphic as data URL for zero-effort hackathon demo
function generateSamplePrescriptionDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');

  // Background Rx paper
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 750);

  // Border & Header
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 560, 710);

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('ST. JUDE MEMORIAL HOSPITAL & CLINIC', 45, 65);

  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('Dr. Arvind Sen, MD, Pulmonology & Critical Care | Reg: MED-99218', 45, 90);
  ctx.fillText('Emergency OPD & Respiratory Medicine Department', 45, 108);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(560, 120);
  ctx.stroke();

  // Patient Info
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Patient: Rohan Sharma        Age: 24 Yrs        Date: Today', 45, 145);
  ctx.fillText('Allergies: Penicillin, NSAIDs (CRITICAL)      Blood: O-Negative', 45, 168);

  ctx.beginPath();
  ctx.moveTo(40, 185);
  ctx.lineTo(560, 185);
  ctx.stroke();

  // Rx Symbol
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText('℞', 45, 230);

  // Handwritten cursive styling simulation
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'italic 18px "Brush Script MT", cursive, sans-serif';
  ctx.fillText('1. Tab. Azithromycin 500mg - 1 Tab OD (Morning, Before Food) x 5 days', 60, 275);
  ctx.fillText('2. Tab. Levocetirizine + Montelukast - 1 Tab HS (Night, After Food) x 10 days', 60, 330);
  ctx.fillText('3. Cap. Pantoprazole 40mg - 1 Cap OD (Morning Empty Stomach) x 7 days', 60, 385);
  ctx.fillText('4. Tab. Paracetamol 650mg - 1 Tab TDS SOS (After Food) x 3 days', 60, 440);
  ctx.fillText('5. Salbutamol Inhaler - 2 puffs as needed for bronchospasm relief', 60, 495);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Doctor Note: Strictly avoid Amoxicillin/Penicillin & Ibuprofen due to reported allergies.', 45, 570);
  ctx.fillText('Hydration therapy and inhaler technique advised. Review after 5 days.', 45, 590);

  // Signature
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(420, 680);
  ctx.quadraticCurveTo(460, 640, 500, 680);
  ctx.quadraticCurveTo(530, 630, 550, 670);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Dr. Arvind Sen, MD', 430, 700);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function PrescriptionVerify() {
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [approving, setApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load built-in sample prescription
  const handleLoadSample = () => {
    const sampleB64 = generateSamplePrescriptionDataUrl();
    setPrescriptionImage(sampleB64);
    setApprovalSuccess(false);
    setErrorMsg('');
  };

  // Handle local image upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPrescriptionImage(reader.result);
        setApprovalSuccess(false);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI OCR Extraction
  const handleAnalyzePrescription = async () => {
    if (!prescriptionImage) {
      setErrorMsg('Please upload a prescription image or click Load Sample Doctor Prescription first.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');
    setApprovalSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/analyze-prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: prescriptionImage,
          patient_id: 1
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setPrescriptionId(data.id);
      setDoctorNotes(data.doctor_notes || '');
      setMedicines(data.medicines || []);
    } catch (err) {
      console.error('Prescription OCR error:', err);
      setErrorMsg(`OCR analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle table edits
  const handleMedChange = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleTimingToggle = (index, slot) => {
    setMedicines((prev) => {
      const updated = [...prev];
      const curTiming = updated[index].timing || [];
      if (curTiming.includes(slot)) {
        updated[index].timing = curTiming.filter((s) => s !== slot);
      } else {
        updated[index].timing = [...curTiming, slot];
      }
      return updated;
    });
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        medicine_name: 'New Medicine',
        dosage: '1 tablet',
        timing: ['Morning'],
        meal_relation: 'After Food',
        duration_days: 5,
        confidence: 'Manual Add',
        taken_today: false
      }
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Approve & Push to Patient Mobile Timetable
  const handleApproveAndPush = async () => {
    if (!prescriptionId) {
      setErrorMsg('No active prescription loaded to approve.');
      return;
    }

    setApproving(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/prescriptions/${prescriptionId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: medicines,
          doctor_notes: doctorNotes
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      setApprovalSuccess(true);
      setTimeout(() => setApprovalSuccess(false), 6000);
    } catch (err) {
      console.error('Verification push error:', err);
      setErrorMsg(`Failed to push to mobile timetable: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Doctor Prescription Handwriting OCR & Verification
              <span className="text-xs bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold px-2 py-0.5 rounded-full uppercase">
                Clinical Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Convert illegible doctor handwriting to verified dosage schedules and synchronize directly into patient mobile reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Load Sample Doctor Prescription
          </button>
        </div>
      </div>

      {approvalSuccess && (
        <div className="mb-6 p-4 bg-emerald-950/90 border-2 border-emerald-500/80 rounded-2xl shadow-xl flex items-center justify-between text-emerald-200 glow-emerald">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Prescription Approved & Pushed!</h4>
              <p className="text-xs text-emerald-300">
                Patient Rohan Sharma's mobile timetable has been instantly synchronized with {medicines.length} verified medicines.
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-800/80 text-white font-bold px-3 py-1 rounded-lg">
            Status: Doctor Verified
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Split-screen Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Side: Upload & Prescription Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-400" />
              1. Prescription Image Source
            </span>
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-semibold transition">
              <span>Browse Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden flex items-center justify-center min-h-[350px] relative p-2">
            {prescriptionImage ? (
              <img
                src={prescriptionImage}
                alt="Prescription preview"
                className="max-h-[460px] w-auto object-contain rounded-lg shadow"
              />
            ) : (
              <div className="text-center p-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-xs font-semibold text-slate-400 mb-1">No prescription image loaded</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-4">
                  Upload an image of a handwritten prescription or click "Load Sample Doctor Prescription" above.
                </p>
                <button
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/50 rounded-lg text-xs font-bold transition"
                >
                  Load Instant Sample
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleAnalyzePrescription}
              disabled={analyzing || !prescriptionImage}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Decoding Handwriting with Vision AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  Analyze & OCR Prescription
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: AI-Extracted Medicine Table & Clinical Verification (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              2. Clinical Verification & Schedule Review
            </span>

            <button
              onClick={handleAddMedicine}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Medicine
            </button>
          </div>

          {/* Doctor Notes Box */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Physician Consultation Notes & Safety Flags:
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Doctor notes extracted by AI or physician observations..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Medicines Editable Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[250px] border border-slate-800 rounded-xl bg-slate-950/60 p-2">
            {medicines.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-xs">
                Click "Analyze & OCR Prescription" to extract medicine dosages and schedules.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2 pl-2">Medicine Name</th>
                    <th className="pb-2">Dosage</th>
                    <th className="pb-2">Slots (M / A / N)</th>
                    <th className="pb-2">Food Relation</th>
                    <th className="pb-2">Days</th>
                    <th className="pb-2 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {medicines.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-2.5 pl-2 pr-2">
                        <input
                          type="text"
                          value={med.medicine_name}
                          onChange={(e) => handleMedChange(idx, 'medicine_name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                        />
                        {med.confidence && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            OCR Confidence: {med.confidence}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Morning, Afternoon, Night Checkboxes */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <label className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            (med.timing || []).includes('Morning')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <input
                              type="checkbox"
                              checked={(med.timing || []).includes('Morning')}
                              onChange={() => handleTimingToggle(idx, 'Morning')}
                              className="hidden"
                            />
                            M
                          </label>

                          <label className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            (med.timing || []).includes('Afternoon')
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <input
                              type="checkbox"
                              checked={(med.timing || []).includes('Afternoon')}
                              onChange={() => handleTimingToggle(idx, 'Afternoon')}
                              className="hidden"
                            />
                            A
                          </label>

                          <label className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            (med.timing || []).includes('Night')
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            <input
                              type="checkbox"
                              checked={(med.timing || []).includes('Night')}
                              onChange={() => handleTimingToggle(idx, 'Night')}
                              className="hidden"
                            />
                            N
                          </label>
                        </div>
                      </td>

                      <td className="py-2.5 pr-2">
                        <select
                          value={med.meal_relation || 'After Food'}
                          onChange={(e) => handleMedChange(idx, 'meal_relation', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                        </select>
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          value={med.duration_days || 5}
                          onChange={(e) => handleMedChange(idx, 'duration_days', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2.5 text-right pr-2">
                        <button
                          onClick={() => handleRemoveMedicine(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {medicines.length} medicine(s) scheduled for verification
            </span>
            <button
              onClick={handleApproveAndPush}
              disabled={approving || medicines.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 text-xs shadow-lg glow-emerald disabled:opacity-50"
            >
              {approving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Pushing to Patient App...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Approve & Push to Patient Mobile App
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
