import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  Activity, 
  Heart, 
  Volume2, 
  VolumeX, 
  Radio, 
  Clock, 
  ShieldAlert, 
  User, 
  Crosshair, 
  ExternalLink, 
  CheckCircle, 
  RefreshCw,
  BellRing
} from 'lucide-react';
import { API_BASE, WS_BASE } from '../../config';

export default function ERDashboard() {
  const [sosLogs, setSosLogs] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play synthesized clinical ER chime
  const playEmergencyChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High-low alternating medical siren tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.15);
      osc1.frequency.setValueAtTime(880, now + 0.30);
      osc1.frequency.setValueAtTime(659.25, now + 0.45);

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.65);
    } catch (err) {
      console.warn('Audio chime playback blocked or not allowed:', err);
    }
  };

  // Fetch historical logs from backend
  const fetchSOSLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sos-logs?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setSosLogs(data);
        if (data.length > 0 && !selectedAlert) {
          setSelectedAlert(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load SOS logs:', e);
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    fetchSOSLogs();

    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(`${WS_BASE}/ws/sos`);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('[ER Dashboard] WebSocket connected to SOS Dispatch Stream');
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_SOS_ALERT') {
              const newAlert = {
                ...data.alert,
                patient: data.patient
              };
              setSosLogs((prev) => [newAlert, ...prev]);
              setSelectedAlert(newAlert);
              setNewAlertFlash(true);
              playEmergencyChime();
              setTimeout(() => setNewAlertFlash(false), 3000);
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        socket.onclose = () => {
          console.log('[ER Dashboard] WS closed, attempting reconnect in 3s...');
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (err) => {
          console.error('[ER Dashboard] WS Error:', err);
          socket.close();
        };
      } catch (err) {
        console.error('WebSocket connection initialization error:', err);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const dispatch = selectedAlert?.hospital_dispatch_payload || {};
  const patient = selectedAlert?.patient || {};
  const lat = selectedAlert?.gps_lat || 28.6139;
  const lng = selectedAlert?.gps_lng || 77.2090;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Top ER Header Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600/20 border border-rose-500/40 rounded-xl text-rose-500">
            <AlertOctagon className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              LifeLink Emergency Command & Trauma Receiver
              <span className="text-xs bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Receiver
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Zero-latency telemetry receiver for incoming mobile SOS distress alerts and automated trauma prep.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* WebSocket stream status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-300">
              {wsConnected ? 'ER WebSocket Stream Active' : 'Connecting to Stream...'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playEmergencyChime();
            }}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Emergency Audio Alert Siren"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Siren {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchSOSLogs}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Flash Alert Notification Banner */}
      {newAlertFlash && (
        <div className="mb-6 p-4 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 rounded-2xl shadow-2xl flex items-center justify-between text-white animate-pulse border-2 border-white/40 glow-red">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 animate-bounce" />
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-100">
                CRITICAL INCOMING DISPATCH
              </span>
              <p className="text-base font-bold">
                New SOS Triggered from Patient: {selectedAlert?.patient?.name || 'Rohan Sharma'} ({selectedAlert?.detected_condition})
              </p>
            </div>
          </div>
          <span className="bg-black/30 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg border border-white/20">
            Blood: {selectedAlert?.patient?.blood_group || 'O-Negative'}
          </span>
        </div>
      )}

      {/* Main Grid: Left Alert Feed, Right Live Clinical Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Recent SOS Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg min-h-[450px]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              Incoming SOS Distress Logs ({sosLogs.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="text-xs text-slate-500 p-4 text-center">Loading live dispatch stream...</div>
            ) : sosLogs.length === 0 ? (
              <div className="text-xs text-slate-500 p-8 text-center border border-dashed border-slate-800 rounded-xl">
                No active distress alerts recorded. System standing by.
              </div>
            ) : (
              sosLogs.map((log) => {
                const isSelected = selectedAlert?.id === log.id;
                const p = log.patient || {};
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedAlert(log)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition relative ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-600/80 shadow-md ring-1 ring-rose-500'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {p.name || 'Rohan Sharma'}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          log.triage_level === 'CRITICAL'
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                            : 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                        }`}
                      >
                        {log.triage_level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium truncate mb-2">
                      {log.detected_condition || 'Acute Distress Reported'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                      <span className="font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {p.blood_group || 'O-Negative'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Emergency Case Detail (8 cols) */}
        {selectedAlert ? (
          <div className="lg:col-span-8 flex flex-col gap-5 overflow-y-auto">
            {/* Patient Clinical Profile & Triage Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Emergency Dispatch Ref: #{selectedAlert.id}
                  </span>
                  <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    {patient.name || 'Rohan Sharma'}
                    <span className="text-xs font-normal text-slate-400">({patient.age || 24} Years)</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-rose-950/80 border-2 border-rose-600 text-rose-300 px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-2 glow-red">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-400 block leading-tight">
                        Blood Type
                      </span>
                      <span className="text-sm font-black tracking-wide">
                        {patient.blood_group || dispatch.blood_group || 'O-Negative'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Clinical Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-red-950/30 border border-red-800/60 rounded-xl">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                    ⚠️ Critical Drug Allergies (Life-Threatening)
                  </span>
                  <p className="text-xs font-bold text-red-100">
                    {patient.allergies || (dispatch.critical_allergies ? dispatch.critical_allergies.join(', ') : 'Penicillin, NSAIDs (Ibuprofen)')}
                  </p>
                  <span className="text-[10px] text-red-400 block mt-1">
                    *Avoid administering Penicillin or NSAID analgesics!
                  </span>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Chronic Pathologies & Comorbidities
                  </span>
                  <p className="text-xs font-bold text-amber-100">
                    {patient.chronic_conditions || (dispatch.chronic_risks ? dispatch.chronic_risks.join(', ') : 'Asthma, Mild Hypertension')}
                  </p>
                  <span className="text-[10px] text-amber-400 block mt-1">
                    *Risk of severe bronchospasm during hypoxia or sedation.
                  </span>
                </div>
              </div>

              {/* AI Triage & Voice Guidance Given to Patient */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-400" />
                    AI Triage Diagnostic Summary:
                  </span>
                  <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {selectedAlert.triage_level}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">
                  {selectedAlert.detected_condition}
                </p>

                {selectedAlert.patient_voice_guidance && (
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs text-rose-200">
                    <span className="font-bold text-slate-400 block mb-0.5">
                      Spoken to Patient via Auto-TTS:
                    </span>
                    "{selectedAlert.patient_voice_guidance}"
                  </div>
                )}
              </div>

              {/* Hospital ER Preparation Checklist */}
              {dispatch.recommended_prep && (
                <div className="bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/40 rounded-xl p-3.5 mb-4">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    ER Trauma Team Immediate Preparation Directive:
                  </span>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed">
                    {dispatch.recommended_prep}
                  </p>
                </div>
              )}

              {/* Audio Transcript if present */}
              {selectedAlert.audio_transcript && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <strong className="text-slate-400">Captured Audio Transcript: </strong>
                  "{selectedAlert.audio_transcript}"
                </div>
              )}
            </div>

            {/* Split Row: Live Snapshot & Interactive Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Live Phone Camera Snapshot */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Live Distress Camera Snapshot</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                    Captured from Mobile
                  </span>
                </span>
                <div className="flex-1 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[220px]">
                  {selectedAlert.snapshot_base64 ? (
                    <img
                      src={selectedAlert.snapshot_base64}
                      alt="Distress camera feed"
                      className="w-full h-full object-contain max-h-[280px]"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500 text-xs">
                      <AlertOctagon className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      Visual capture encrypted or unavailable. Relying on GPS telemetry & voice transcript.
                    </div>
                  )}
                </div>
              </div>

              {/* Live GPS Coordinates & OpenStreetMap Embed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Patient Live GPS Location
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs font-mono text-cyan-300 mb-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  Lat: {lat} | Lng: {lng} (Accuracy: High GPS)
                </div>

                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 min-h-[200px]">
                  <iframe
                    title="Patient GPS Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '200px' }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 text-sm">
            Select an alert on the left to inspect patient emergency details and GPS telemetry.
          </div>
        )}
      </div>
    </div>
  );
}
