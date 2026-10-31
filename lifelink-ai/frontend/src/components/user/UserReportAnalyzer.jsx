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
  RefreshCw, 
  HeartPulse, 
  Apple,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Brain,
  ShieldCheck,
  Activity,
  Flame,
  Check
} from 'lucide-react';
import { API_BASE } from '../../config';

// Synthetic sample blood test report generator as data URL
function generateSampleLabReportDataUrl() {
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 650, 780);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, 610, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('DIAGNOSTIC PATHOLOGY LABORATORY', 40, 55);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Comprehensive Blood & Health Investigation Panel', 40, 78);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(20, 105, 610, 55);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Patient Name: Rohan Sharma', 40, 130);
  ctx.fillText('Age: 24 Yrs', 300, 130);
  ctx.fillText('Sample: Fasting Serum', 450, 130);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(20, 175, 610, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TEST NAME', 40, 195);
  ctx.fillText('RESULT', 280, 195);
  ctx.fillText('NORMAL RANGE', 420, 195);
  ctx.fillText('UNITS', 550, 195);

  const rows = [
    { name: 'Fasting Blood Glucose', value: '148.0 *HIGH*', ref: '70.0 - 99.0', unit: 'mg/dL', high: true },
    { name: 'HbA1c (Average Sugar)', value: '6.9 *HIGH*', ref: '< 5.7', unit: '%', high: true },
    { name: 'Hemoglobin (Hb)', value: '10.6 *LOW*', ref: '13.0 - 17.0', unit: 'g/dL', low: true },
    { name: 'Total Cholesterol', value: '224.0 *HIGH*', ref: '< 200.0', unit: 'mg/dL', high: true },
    { name: 'Serum Creatinine', value: '0.90', ref: '0.70 - 1.30', unit: 'mg/dL' },
    { name: 'Total Platelet Count', value: '245,000', ref: '150,000 - 450,000', unit: '/uL' },
    { name: 'Serum Triglycerides', value: '178.0 *HIGH*', ref: '< 150.0', unit: 'mg/dL', high: true }
  ];

  let y = 230;
  rows.forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(20, y - 18, 610, 30);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(r.name, 40, y);

    if (r.high) ctx.fillStyle = '#dc2626';
    else if (r.low) ctx.fillStyle = '#d97706';
    else ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(r.value, 280, y);

    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText(r.ref, 420, y);
    ctx.fillText(r.unit, 550, y);

    y += 34;
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function UserReportAnalyzer() {
  const [reportImage, setReportImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);

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
      setErrorMsg('Please upload a lab report photo or load the sample blood report first.');
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Report simplification error:', err);
      setErrorMsg(`Report analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

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
    <div className="flex flex-col min-h-full p-4 sm:p-8 max-w-6xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              My Lab & Blood Report AI Simplifier
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
              Google Gemini 2.5 Flash Vision API
            </span>
            <span>• Multimodal Biomarker Extraction & Hinglish Voice Readout</span>
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="px-4 py-2.5 glass-panel hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-2xl transition shadow-md flex items-center gap-2 hover:border-emerald-500/40 active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Load Sample Blood Report</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-700/80 rounded-2xl text-xs text-red-200 flex items-center gap-3 shadow-lg glow-red animate-shake">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Scanner View */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/90 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              1. Your Medical Report Photo
            </span>
            <label className="cursor-pointer bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition shadow-sm hover:border-slate-500 active:scale-95">
              <span>Browse File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Scanner Viewport */}
          <div className="relative flex-1 bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden flex items-center justify-center min-h-[340px] p-2.5 shadow-inner">
            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500/60 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500/60 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500/60 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500/60 pointer-events-none" />

            {/* Laser Scanline Effect during analysis */}
            {analyzing && <div className="animate-scanline" />}

            {reportImage ? (
              <img 
                src={reportImage} 
                alt="Report preview" 
                className="max-h-[380px] w-full object-contain rounded-xl shadow-lg" 
              />
            ) : (
              <div className="text-center p-8 text-slate-500 text-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FileSpreadsheet className="w-8 h-8 text-slate-600" />
                </div>
                <p className="font-bold text-slate-300 mb-1 text-sm">No report uploaded yet</p>
                <p className="text-[11px] text-slate-500 mb-4 max-w-xs mx-auto">
                  Upload a photo of your blood test, pathology report, or click below to test the instant demo.
                </p>
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold transition shadow-sm"
                >
                  Load Sample Blood Report
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !reportImage}
            className="mt-5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-xl glow-emerald disabled:opacity-50 active:scale-[0.98]"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Scanning with Gemini 2.5 Flash Vision...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" /> 
                <span>Simplify Report with Gemini Vision API</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Clinical Explanation & Biomarker Cards */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 shadow-2xl border border-slate-800/90 overflow-y-auto">
          {analysisResult ? (
            <div className="space-y-5">
              {/* Gemini Vision Banner */}
              <div className="p-3.5 glass-panel rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-700/60 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-bold bg-cyan-950/90 px-3 py-1.5 rounded-xl border border-cyan-700/60 shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    {analysisResult.ocr_model || 'Gemini 2.5 Flash Vision'}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-700/60 shadow-sm">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    {analysisResult.analysis_model || 'Clinical Engine'}
                  </span>
                </div>

                <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                  analysisResult.overall_status === 'Normal'
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600 glow-emerald'
                    : 'bg-amber-950/90 text-amber-300 border border-amber-600 shadow-md'
                }`}>
                  {analysisResult.overall_status === 'Normal' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  )}
                  <span>{analysisResult.overall_status || 'Reviewed'}</span>
                </span>
              </div>

              {/* Simple Voice Explanation Card with Waveform */}
              <div className="p-5 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-700/60 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Simple Patient Voice Explanation (Hinglish + English):
                  </span>
                  
                  <button
                    onClick={toggleSpeech}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95 ${
                      isSpeaking 
                        ? 'bg-rose-600 text-white animate-pulse glow-red' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 bg-white soundwave-bar" />
                          <span className="w-1 bg-white soundwave-bar delay-75" />
                          <span className="w-1 bg-white soundwave-bar delay-150" />
                        </div>
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔊 Read Aloud</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-indigo-100 font-medium leading-relaxed glass-panel p-4 rounded-xl border border-slate-700/60 shadow-inner">
                  "{analysisResult.simple_patient_explanation}"
                </p>
              </div>

              {/* Collapsible Clinical Investigations Table */}
              {analysisResult.extracted_ocr_text && (
                <div className="border border-slate-800 rounded-2xl bg-slate-950/80 overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setShowRawOcr(!showRawOcr)}
                    className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition bg-slate-950/90 hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-2 text-cyan-400">
                      <FileText className="w-4 h-4" />
                      View Full Clinical Investigations Breakdown ({showRawOcr ? 'Hide' : 'Show'})
                    </span>
                    {showRawOcr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showRawOcr && (
                    <div className="p-4 bg-black/70 border-t border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {analysisResult.extracted_ocr_text}
                    </div>
                  )}
                </div>
              )}

              {/* Clinical Summary */}
              <div className="p-4 glass-panel border border-slate-800 rounded-2xl shadow-md">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Physician Assessment (Gemini 2.5 Flash)
                </span>
                <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                  {analysisResult.clinical_summary}
                </p>
              </div>

              {/* Biomarker Cards Grid */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Your Tested Health Biomarkers:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(analysisResult.parameters || []).map((param, idx) => {
                    const status = (param.status || 'NORMAL').toUpperCase();
                    const isHigh = status === 'HIGH' || status === 'CRITICAL';
                    const isLow = status === 'LOW';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] shadow-lg ${
                          isHigh
                            ? 'bg-gradient-to-br from-rose-950/30 to-red-950/10 border-rose-800/60 hover:border-rose-600'
                            : isLow
                            ? 'bg-gradient-to-br from-amber-950/30 to-yellow-950/10 border-amber-800/60 hover:border-amber-600'
                            : 'bg-gradient-to-br from-emerald-950/30 to-teal-950/10 border-emerald-900/50 hover:border-emerald-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white truncate max-w-[180px]">
                            {param.name}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-sm ${
                            isHigh 
                              ? 'bg-rose-600/30 text-rose-300 border-rose-500/50' 
                              : isLow 
                              ? 'bg-amber-600/30 text-amber-300 border-amber-500/50' 
                              : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                          }`}>
                            {status}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1.5">
                          <span className="text-lg font-black text-white tracking-tight">
                            {param.value}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Norm: {param.reference_range})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 font-medium leading-snug">
                          {param.simple_meaning}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diet & Lifestyle Guidance */}
              {analysisResult.diet_and_lifestyle_tips && (
                <div className="p-5 glass-panel border border-slate-800 rounded-2xl shadow-xl">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Apple className="w-4 h-4 text-amber-400" />
                    Doctor & AI Recommended Food & Lifestyle Tips:
                  </span>
                  
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {analysisResult.diet_and_lifestyle_tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-14 text-center text-slate-500 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 shadow-inner">
                <Sparkles className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-300 mb-1">No report analyzed yet</p>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Upload your blood test photo or click "Load Sample Blood Report", then click "Simplify Report with Gemini Vision API".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
