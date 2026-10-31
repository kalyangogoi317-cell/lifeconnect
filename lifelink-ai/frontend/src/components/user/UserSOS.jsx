import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  Mic, 
  MicOff, 
  MapPin, 
  ShieldAlert, 
  Volume2, 
  CheckCircle, 
  Heart, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function UserSOS({ currentUser }) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, capturing, dispatched, error
  const [triageResponse, setTriageResponse] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: 28.6139, lng: 77.2090, accuracy: 'High' });
  const [snapshotPreview, setSnapshotPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Locate GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: `${Math.round(pos.coords.accuracy)}m`
          });
        },
        (err) => console.warn('GPS default used:', err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAudioTranscript((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type or use quick chips.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const speakGuidance = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const captureFrame = async () => {
    let capturedBase64 = '';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        await new Promise((r) => setTimeout(r, 400));

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, 640, 480);
          capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setSnapshotPreview(capturedBase64);
        }
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      // Synthetic fallback
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(200, 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY ACTIVE', 200, 145);
        ctx.font = '12px sans-serif';
        ctx.fillText(`GPS: ${gpsLocation.lat}, ${gpsLocation.lng}`, 200, 170);
        capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setSnapshotPreview(capturedBase64);
      }
    }
    return capturedBase64;
  };

  const handleTriggerSOS = async (customSymptom = null) => {
    setIsTriggering(true);
    setSosStatus('capturing');
    setErrorMessage('');

    const transcriptToSend = customSymptom || audioTranscript || "Severe acute medical emergency. Need immediate guidance.";

    try {
      const snapshotB64 = await captureFrame();
      setSosStatus('dispatching');

      const res = await fetch(`${API_BASE}/api/trigger-sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: currentUser?.id || 1,
          gps_lat: gpsLocation.lat,
          gps_lng: gpsLocation.lng,
          snapshot_base64: snapshotB64,
          audio_transcript: transcriptToSend
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTriageResponse(data);
      setSosStatus('dispatched');

      if (data.patient_voice_guidance) {
        speakGuidance(data.patient_voice_guidance);
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
      setErrorMessage(`Failed to trigger: ${err.message}. Please dial emergency phone directly.`);
      setSosStatus('error');
    } finally {
      setIsTriggering(false);
    }
  };

  const lat = gpsLocation.lat;
  const lng = gpsLocation.lng;

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Hidden media elements */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* User Medical ID Passport Banner */}
      <div className="glass-panel border border-slate-800/90 rounded-3xl p-5 sm:p-6 mb-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30 shadow-md">
              <Heart className="w-6 h-6 fill-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{currentUser?.name || 'Rohan Sharma'}</h2>
                <span className="text-xs bg-rose-600/30 text-rose-300 border border-rose-500/50 font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                  {currentUser?.blood_group || 'O-Negative'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Your Personal Emergency ID & Live AI First-Aid Guardian (Google Gemini 2.5 Flash)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 glass-panel px-3.5 py-1.5 rounded-xl border border-slate-700/60 font-mono shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>GPS: {lat}, {lng}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="glass-panel p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Critical Drug Allergies</span>
            <span className="text-rose-400 font-bold text-xs">{currentUser?.allergies || 'Penicillin, NSAIDs (Ibuprofen)'}</span>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Chronic Conditions</span>
            <span className="text-amber-300 font-bold text-xs">{currentUser?.chronic_conditions || 'Asthma, Mild Hypertension'}</span>
          </div>
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Emergency ICE Contact</span>
              <span className="text-cyan-400 font-bold text-xs">{currentUser?.emergency_contact || '+91-9876543210 (Father)'}</span>
            </div>
            {currentUser?.emergency_contact && (
              <a
                href={`tel:${currentUser.emergency_contact.split(' ')[0]}`}
                className="p-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-xl transition border border-cyan-500/30 shadow-sm"
                title="Call Emergency Contact"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {sosStatus !== 'dispatched' ? (
        /* IDLE TRIGGER SCREEN */
        <div className="flex flex-col items-center justify-center text-center my-auto py-4">
          <span className="text-xs font-bold px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full inline-flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            One-Tap AI Emergency Responder
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            Tap SOS for Instant First-Aid & Emergency Alert
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Pressing SOS captures your situation, broadcasts your blood group to emergency contacts, and speaks lifesaving first-aid steps.
          </p>

          {/* Giant Pulsing SOS Button */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full bg-rose-600/15 animate-ping-slow pointer-events-none" />
            <div className="absolute w-52 h-52 rounded-full bg-rose-600/25 animate-pulse pointer-events-none" />

            <button
              onClick={() => handleTriggerSOS()}
              disabled={isTriggering}
              className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white font-black shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-all duration-150 border-4 border-rose-400/80 glow-red disabled:opacity-75"
            >
              {isTriggering ? (
                <>
                  <RefreshCw className="w-12 h-12 animate-spin text-white mb-2" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {sosStatus === 'capturing' ? 'Capturing...' : 'Alerting...'}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-14 h-14 text-white mb-1 drop-shadow" />
                  <span className="text-3xl tracking-widest font-extrabold uppercase drop-shadow">
                    SOS
                  </span>
                  <span className="text-[11px] font-medium tracking-wider text-rose-100 uppercase opacity-90 mt-0.5">
                    Emergency Alert
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Speech & Presets */}
          <div className="w-full max-w-md mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                Speak or Type Your Emergency Symptoms:
              </label>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold transition ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? 'Stop' : 'Voice Input'}</span>
              </button>
            </div>

            <input
              type="text"
              value={audioTranscript}
              onChange={(e) => setAudioTranscript(e.target.value)}
              placeholder="e.g. Severe bleeding from cut, difficulty breathing, fell down..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 mb-3"
            />

            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Quick Presets:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setAudioTranscript("Road accident, bleeding from arm, feeling dizzy");
                  handleTriggerSOS("Road accident, bleeding from arm, feeling dizzy");
                }}
                className="bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 p-2 rounded-xl text-left text-[11px] text-slate-200 transition"
              >
                🩸 Accident & Bleeding
              </button>
              <button
                onClick={() => {
                  setAudioTranscript("Acute chest pain, pressure radiating to shoulder, shortness of breath");
                  handleTriggerSOS("Acute chest pain, pressure radiating to shoulder, shortness of breath");
                }}
                className="bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 p-2 rounded-xl text-left text-[11px] text-slate-200 transition"
              >
                ❤️ Chest Pain / Cardiac
              </button>
              <button
                onClick={() => {
                  setAudioTranscript("Severe asthma attack, wheezing, inhaler not opening airways");
                  handleTriggerSOS("Severe asthma attack, wheezing, inhaler not opening airways");
                }}
                className="bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 p-2 rounded-xl text-left text-[11px] text-slate-200 transition"
              >
                🫁 Asthma / Choking
              </button>
              <button
                onClick={() => {
                  setAudioTranscript("Fell down, severe joint pain, unable to move limb");
                  handleTriggerSOS("Fell down, severe joint pain, unable to move limb");
                }}
                className="bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 p-2 rounded-xl text-left text-[11px] text-slate-200 transition"
              >
                🦴 Fall & Fracture
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* DISPATCHED ACTIVE EMERGENCY STATE */
        <div className="space-y-4 my-auto py-2">
          <div className="bg-gradient-to-r from-rose-900/40 to-slate-900 border-2 border-rose-500 rounded-3xl p-5 sm:p-6 shadow-2xl glow-red">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-800/40">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-rose-500 animate-ping" />
                <div>
                  <h3 className="text-base font-black text-rose-300 uppercase tracking-wider">
                    Emergency Alert Active
                  </h3>
                  <span className="text-xs text-rose-200">
                    Live GPS Telemetry & Medical Profile Broadcasted
                  </span>
                </div>
              </div>
              <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-xl">
                {triageResponse?.triage_level || 'CRITICAL'}
              </span>
            </div>

            {/* AI Calm Spoken Guidance */}
            <div className="bg-slate-950/90 border border-rose-600/40 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  LifeLink AI Spoken First-Aid Instructions:
                </span>
                <button
                  onClick={() => speakGuidance(triageResponse?.patient_voice_guidance)}
                  className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3 h-3" /> Replay Voice
                </button>
              </div>
              <p className="text-sm text-rose-100 font-medium leading-relaxed">
                "{triageResponse?.patient_voice_guidance}"
              </p>
            </div>

            {/* Condition & Emergency Prep */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                  Detected Condition
                </span>
                <p className="text-xs font-bold text-white">
                  {triageResponse?.detected_condition}
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                  Emergency Contact Notified
                </span>
                <p className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {currentUser?.emergency_contact || '+91-9876543210'}
                </p>
              </div>
            </div>

            {/* Split: Camera capture & Live Map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {snapshotPreview && (
                <div className="bg-black rounded-xl overflow-hidden border border-slate-800 h-44 flex items-center justify-center">
                  <img src={snapshotPreview} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-slate-800 h-44">
                <iframe
                  title="GPS Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSosStatus('idle');
                  setTriageResponse(null);
                  setSnapshotPreview(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition"
              >
                Reset / Back to Safety Mode
              </button>
              <button
                onClick={() => handleTriggerSOS()}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition shadow-lg glow-red"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
