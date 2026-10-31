import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  RefreshCw,
  HeartPulse,
  Apple
} from 'lucide-react';
import { API_BASE } from '../../config';

// Synthetic sample blood test report generator as data URL
function generateSampleLabReportDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Background Paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 650, 800);

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, 610, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('APEX DIAGNOSTIC & CLINICAL PATHOLOGY LAB', 40, 55);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('NABL Accredited Laboratory | ISO 15189:2012 Certified', 40, 80);

  // Patient Info Bar
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(20, 110, 610, 60);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Patient Name: Rohan Sharma', 40, 135);
  ctx.fillText('Age / Gender: 24 Yrs / Male', 250, 135);
  ctx.fillText('Ref By: Dr. Arvind Sen', 440, 135);

  ctx.fillText('Sample: Fasting Serum & Whole Blood', 40, 155);
  ctx.fillText('Date: Current', 250, 155);
  ctx.fillText('Lab ID: APX-99412', 440, 155);

  // Table Header
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(20, 185, 610, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TEST INVESTIGATION', 40, 205);
  ctx.fillText('RESULT', 270, 205);
  ctx.fillText('REFERENCE RANGE', 400, 205);
  ctx.fillText('UNITS', 550, 205);

  // Table Rows
  const rows = [
    { name: 'Fasting Blood Glucose (FBG)', value: '148.0 *HIGH*', ref: '70.0 - 99.0', unit: 'mg/dL', high: true },
    { name: 'HbA1c (Glycated Hemoglobin)', value: '6.9 *HIGH*', ref: '< 5.7 (Normal)', unit: '%', high: true },
    { name: 'Hemoglobin (Hb)', value: '10.6 *LOW*', ref: '13.0 - 17.0', unit: 'g/dL', low: true },
    { name: 'Total Cholesterol', value: '224.0 *HIGH*', ref: '< 200.0', unit: 'mg/dL', high: true },
    { name: 'Serum Creatinine', value: '0.90', ref: '0.70 - 1.30', unit: 'mg/dL' },
    { name: 'Total Platelet Count', value: '245,000', ref: '150,000 - 450,000', unit: '/uL' },
    { name: 'WBC (Total Leukocyte Count)', value: '7,400', ref: '4,000 - 11,000', unit: '/uL' },
    { name: 'Serum Triglycerides', value: '178.0 *HIGH*', ref: '< 150.0', unit: 'mg/dL', high: true }
  ];

  let y = 240;
  rows.forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(20, y - 18, 610, 30);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(r.name, 40, y);

    if (r.high) {
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
    } else if (r.low) {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 12px sans-serif';
    } else {
      ctx.fillStyle = '#059669';
      ctx.font = '12px sans-serif';
    }
    ctx.fillText(r.value, 270, y);

    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText(r.ref, 400, y);
    ctx.fillText(r.unit, 550, y);

    y += 34;
  });

  // End Note
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(30, 680);
  ctx.lineTo(620, 680);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 11px sans-serif';
  ctx.fillText('* Marked values are outside clinical reference limits. Clinical correlation is recommended.', 40, 710);
  ctx.fillText('Authorized Signatory: Chief Medical Pathologist, MD', 40, 740);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ReportAnalyzer() {
  const [reportImage, setReportImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoadSample = () => {
    const b64 = generateSampleLabReportDataUrl();
    setReportImage(b64);
    setAnalysisResult(null);
    setErrorMsg('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReportImage(reader.result);
        setAnalysisResult(null);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!reportImage) {
      setErrorMsg('Please upload a lab report image or load the sample blood report first.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/analyze-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: reportImage })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Report simplification error:', err);
      setErrorMsg(`Report analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Text to Speech playback for Hinglish/English summary
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = analysisResult?.simple_patient_explanation || 'No summary text available to read.';
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Lab & Blood Report AI Simplifier
              <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase">
                Diagnostic Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Upload blood investigations, detect critical/out-of-range biomarkers, and generate bilingual patient voice explanations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Load Sample Blood Report
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Source, Right AI Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Image Upload & Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              1. Medical Report Document
            </span>
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-semibold transition">
              <span>Browse File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden flex items-center justify-center min-h-[350px] p-2 relative">
            {reportImage ? (
              <img
                src={reportImage}
                alt="Report preview"
                className="max-h-[460px] w-auto object-contain rounded-lg shadow"
              />
            ) : (
              <div className="text-center p-8 text-slate-500">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-xs font-semibold text-slate-400 mb-1">No medical report loaded</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-4">
                  Upload an image of a blood or pathology report, or test with the sample report.
                </p>
                <button
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-bold transition"
                >
                  Load Sample Report
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !reportImage}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Biomarkers & Clinical Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Simplify Report with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Parameter Cards & Simple Audio (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg overflow-y-auto">
          {analysisResult ? (
            <div className="space-y-5">
              {/* Overall Status Banner */}
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Diagnostic AI Assessment
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {analysisResult.clinical_summary || 'Analysis Complete'}
                  </h3>
                </div>
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border ${
                    analysisResult.overall_status === 'Critical'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                      : analysisResult.overall_status === 'Attention Required'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                  }`}
                >
                  {analysisResult.overall_status || 'Analyzed'}
                </span>
              </div>

              {/* Simple English / Hinglish Patient Audio Box */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Patient Voice Explanation (English + Hinglish):
                  </span>
                  <button
                    onClick={toggleSpeech}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isSpeaking
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Reading
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> 🔊 Read Report Aloud
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-indigo-100 font-medium leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  "{analysisResult.simple_patient_explanation}"
                </p>
              </div>

              {/* Parameter Cards Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Biomarker Parameters & Reference Comparison ({analysisResult.parameters?.length || 0})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(analysisResult.parameters || []).map((param, idx) => {
                    const status = (param.status || 'NORMAL').toUpperCase();
                    const isHigh = status === 'HIGH' || status === 'CRITICAL';
                    const isLow = status === 'LOW';
                    const isNormal = status === 'NORMAL';

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition ${
                          isHigh
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : isLow
                            ? 'bg-amber-950/20 border-amber-800/60'
                            : 'bg-emerald-950/20 border-emerald-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">
                            {param.name}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                              isHigh
                                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                : isLow
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isHigh && <ArrowUpRight className="w-3 h-3" />}
                            {isLow && <ArrowDownRight className="w-3 h-3" />}
                            {isNormal && <CheckCircle2 className="w-3 h-3" />}
                            {status}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-base font-black text-white">
                            {param.value}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Norm: {param.reference_range})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">
                          {param.simple_meaning}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diet & Lifestyle Guidance Tips */}
              {analysisResult.diet_and_lifestyle_tips && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <Apple className="w-4 h-4" />
                    Doctor & AI Recommended Lifestyle Adaptations:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.diet_and_lifestyle_tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <Sparkles className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-400 mb-1">No analysis generated yet</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Select or upload a blood test report and click "Simplify Report with AI" to generate structured biomarker classifications and speech readout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
