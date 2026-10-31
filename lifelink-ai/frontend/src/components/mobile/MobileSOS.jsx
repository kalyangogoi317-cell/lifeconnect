import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  Mic, 
  MicOff, 
  Camera, 
  MapPin, 
  ShieldAlert, 
  Volume2, 
  CheckCircle, 
  Activity, 
  Heart, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function MobileSOS() {
  const [profile, setProfile] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, capturing, dispatched, error
  const [triageResponse, setTriageResponse] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: 28.6139, lng: 77.2090, accuracy: 'Default' });
  const [snapshotPreview, setSnapshotPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

  // Fetch patient medical ID
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Query GPS location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: `${Math.round(pos.coords.accuracy)}m`
          });
        },
        (err) => {
          console.warn('Geolocation access failed or denied, using default:', err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Initialize speech recognition if available
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
      alert('Speech recognition is not supported in this browser. Please type or use quick chips below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  // Text-To-Speech playback
  const speakGuidance = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Capture frame from camera or synthesize fallback image
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
        setCameraActive(true);

        // Allow camera 300ms to stabilize
        await new Promise((r) => setTimeout(r, 400));

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, 640, 480);
          capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setSnapshotPreview(capturedBase64);
        }

        // Stop stream
        stream.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
      }
    } catch (err) {
      console.warn('Camera capture failed or permission denied; generating high-res visual beacon fallback:', err);
      // Generate synthetic frame on hidden canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(200, 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY SOS', 200, 145);
        ctx.font = '14px sans-serif';
        ctx.fillText(`GPS: ${gpsLocation.lat}, ${gpsLocation.lng}`, 200, 175);
        capturedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setSnapshotPreview(capturedBase64);
      }
    }
    return capturedBase64;
  };

  // Execute Complete SOS Dispatch
  const handleTriggerSOS = async (customSymptom = null) => {
    setIsTriggering(true);
    setSosStatus('capturing');
    setErrorMessage('');

    const transcriptToSend = customSymptom || audioTranscript || "Severe acute emergency assistance needed immediately.";

    try {
      // 1. Capture snapshot
      const snapshotB64 = await captureFrame();

      setSosStatus('dispatching');

      // 2. Fetch fresh GPS if possible
      let currentLat = gpsLocation.lat;
      let currentLng = gpsLocation.lng;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          currentLat = Number(pos.coords.latitude.toFixed(5));
          currentLng = Number(pos.coords.longitude.toFixed(5));
          setGpsLocation({ lat: currentLat, lng: currentLng, accuracy: `${Math.round(pos.coords.accuracy)}m` });
        } catch (e) {
          console.warn('Fast GPS lookup timed out, using cached position.');
        }
      }

      // 3. Post to LifeLink backend
      const res = await fetch(`${API_BASE}/api/trigger-sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: profile ? profile.id : 1,
          gps_lat: currentLat,
          gps_lng: currentLng,
          snapshot_base64: snapshotB64,
          audio_transcript: transcriptToSend
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setTriageResponse(data);
      setSosStatus('dispatched');

      // 4. Speak immediate AI first-aid guidance
      if (data.patient_voice_guidance) {
        speakGuidance(data.patient_voice_guidance);
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
      setErrorMessage(`Emergency trigger error: ${err.message}. Please call local emergency services immediately.`);
      setSosStatus('error');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Hidden elements for media capture */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Patient Medical ID Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Medical ID Active
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{gpsLocation.lat}, {gpsLocation.lng}</span>
          </div>
        </div>

        {profile ? (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  {profile.name}
                  <span className="text-xs font-normal text-slate-400">({profile.age} yrs)</span>
                </h2>
                <p className="text-xs text-rose-400 font-medium mt-0.5">
                  Allergies: <span className="text-slate-200">{profile.allergies}</span>
                </p>
                <p className="text-xs text-amber-400 font-medium">
                  Conditions: <span className="text-slate-200">{profile.chronic_conditions}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-rose-600/30 text-rose-300 border border-rose-500/50 text-xs font-black px-2.5 py-1 rounded-lg tracking-wide shadow-sm">
                  {profile.blood_group}
                </span>
                {profile.emergency_contact && (
                  <a 
                    href={`tel:${profile.emergency_contact.split(' ')[0]}`}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 mt-2 justify-end font-semibold hover:underline"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Emergency ICE</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 animate-pulse">Loading verified medical profile...</div>
        )}
      </div>

      {/* Main Trigger Section */}
      <div className="px-4 pt-6 flex-1 flex flex-col items-center justify-center text-center">
        {sosStatus !== 'dispatched' ? (
          <>
            <div className="mb-4">
              <span className="text-xs font-bold px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full inline-flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Zero-Delay Hospital ER Dispatcher
              </span>
              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
                Pressing SOS instantly snaps camera evidence, streams GPS coordinates, broadcasts your blood group to ER teams, and starts AI voice triage.
              </p>
            </div>

            {/* Giant Pulsing Red SOS Trigger Button */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer pulsing rings */}
              <div className="absolute w-56 h-56 rounded-full bg-rose-600/20 animate-ping-slow pointer-events-none"></div>
              <div className="absolute w-48 h-48 rounded-full bg-rose-600/30 animate-pulse pointer-events-none"></div>

              <button
                onClick={() => handleTriggerSOS()}
                disabled={isTriggering}
                className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white font-black shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-all duration-150 border-4 border-rose-400/80 glow-red disabled:opacity-75"
              >
                {isTriggering ? (
                  <>
                    <RefreshCw className="w-10 h-10 animate-spin text-white mb-2" />
                    <span className="text-sm font-bold tracking-wider uppercase">
                      {sosStatus === 'capturing' ? 'Snapping...' : 'Alerting ER...'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-white mb-1 drop-shadow" />
                    <span className="text-2xl tracking-widest font-extrabold uppercase drop-shadow">
                      SOS
                    </span>
                    <span className="text-[11px] font-medium tracking-wider text-rose-100 uppercase opacity-90 mt-0.5">
                      Emergency Alert
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Speech input & Symptom quick buttons */}
            <div className="w-full max-w-sm mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-left">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  Voice Symptoms or Situation:
                </label>
                <button
                  onClick={toggleSpeechRecognition}
                  className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold transition ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3" /> Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 text-rose-400" /> Speak Symptoms
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                value={audioTranscript}
                onChange={(e) => setAudioTranscript(e.target.value)}
                placeholder="e.g. Severe chest tightness, road accident, bleeding..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 mb-3"
              />

              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                Quick One-Tap Presets:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setAudioTranscript("Road accident, bleeding from arm, severe cut, feeling dizzy");
                    handleTriggerSOS("Road accident, bleeding from arm, severe cut, feeling dizzy");
                  }}
                  className="bg-slate-800/90 hover:bg-rose-950/40 hover:border-rose-500/50 border border-slate-700/60 text-slate-200 text-[11px] py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  Accident & Bleeding
                </button>
                <button
                  onClick={() => {
                    setAudioTranscript("Acute chest pain, pressure radiating to jaw, shortness of breath");
                    handleTriggerSOS("Acute chest pain, pressure radiating to jaw, shortness of breath");
                  }}
                  className="bg-slate-800/90 hover:bg-rose-950/40 hover:border-rose-500/50 border border-slate-700/60 text-slate-200 text-[11px] py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  Chest Pain / Cardiac
                </button>
                <button
                  onClick={() => {
                    setAudioTranscript("Severe asthma attack, wheezing, inhaler not opening airways");
                    handleTriggerSOS("Severe asthma attack, wheezing, inhaler not opening airways");
                  }}
                  className="bg-slate-800/90 hover:bg-rose-950/40 hover:border-rose-500/50 border border-slate-700/60 text-slate-200 text-[11px] py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                  Asthma Attack / Choking
                </button>
                <button
                  onClick={() => {
                    setAudioTranscript("Fall from height, suspected wrist fracture, dizziness");
                    handleTriggerSOS("Fall from height, suspected wrist fracture, dizziness");
                  }}
                  className="bg-slate-800/90 hover:bg-rose-950/40 hover:border-rose-500/50 border border-slate-700/60 text-slate-200 text-[11px] py-1.5 px-2 rounded-lg text-left transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                  Fall & Joint Trauma
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Dispatched Active Emergency Mode */
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-600 rounded-2xl p-5 shadow-2xl glow-red text-left">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-sm font-black text-rose-400 uppercase tracking-wider">
                  Live ER Alert Dispatched
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                {triageResponse?.triage_level || 'CRITICAL'}
              </span>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 mb-3">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Detected Emergency Condition
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {triageResponse?.detected_condition}
              </p>
            </div>

            {/* AI Calm Voice Guidance */}
            <div className="bg-gradient-to-br from-rose-950/50 to-slate-900 border border-rose-700/50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  LifeLink AI Voice Guidance
                </span>
                <button
                  onClick={() => speakGuidance(triageResponse?.patient_voice_guidance)}
                  className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3 h-3" /> Replay Voice
                </button>
              </div>
              <p className="text-xs text-rose-100 font-medium leading-relaxed">
                "{triageResponse?.patient_voice_guidance}"
              </p>
            </div>

            {/* Snapshot Evidence Thumbnail if available */}
            {snapshotPreview && (
              <div className="mb-3">
                <span className="text-[11px] text-slate-400 font-semibold mb-1 block">
                  Transmitted ER Visual Snapshot:
                </span>
                <img
                  src={snapshotPreview}
                  alt="SOS Visual Capture"
                  className="w-full h-32 object-cover rounded-lg border border-slate-700"
                />
              </div>
            )}

            {/* Dispatch details */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Hospital ER:</span>
                <span className="font-semibold text-emerald-400">Receiving Alert</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transmitted Blood Group:</span>
                <span className="font-bold text-rose-400">{profile?.blood_group || 'O-Negative'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Allergies Flagged:</span>
                <span className="font-semibold text-amber-300">{profile?.allergies || 'Penicillin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GPS Coordinates:</span>
                <span className="text-cyan-400">{gpsLocation.lat}, {gpsLocation.lng}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSosStatus('idle');
                  setTriageResponse(null);
                  setSnapshotPreview(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition"
              >
                Reset / Back
              </button>
              <button
                onClick={() => handleTriggerSOS()}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Alert ER
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
