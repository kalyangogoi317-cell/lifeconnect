import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Heart,
  ShieldCheck,
  Zap,
  MessageSquare
} from 'lucide-react';
import { API_BASE } from '../../config';

export default function UserAIChat({ currentUser }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${currentUser?.name || 'Rohan'}! I am Dr. Gemini, your personal clinical AI Health Assistant powered by Google Gemini 2.5 Flash.\n\nI have loaded your medical profile:\n• Blood Group: ${currentUser?.blood_group || 'O-Negative'}\n• Known Allergies: ${currentUser?.allergies || 'Penicillin, NSAIDs (Ibuprofen)'}\n• Chronic Conditions: ${currentUser?.chronic_conditions || 'Asthma'}\n\nHow are you feeling today? You can ask me anything about symptoms, medication safety, or diet advice.`,
      model_used: 'Google Gemini 2.5 Flash',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. Please use Google Chrome or Edge.');
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
      }
    }
  };

  const toggleSpeak = (text, index) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (activeSpeechIndex === index) {
      window.speechSynthesis.cancel();
      setActiveSpeechIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setActiveSpeechIndex(null);
      utterance.onerror = () => setActiveSpeechIndex(null);
      window.speechSynthesis.speak(utterance);
      setActiveSpeechIndex(index);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          patient_context: {
            name: currentUser?.name || 'Rohan Sharma',
            blood_group: currentUser?.blood_group || 'O-Negative',
            allergies: currentUser?.allergies || 'Penicillin, NSAIDs (Ibuprofen)',
            chronic_conditions: currentUser?.chronic_conditions || 'Asthma'
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg = {
        role: 'assistant',
        content: data.reply || 'I am here to help you. Could you please describe your symptoms in more detail?',
        model_used: data.model_used || 'Google Gemini 2.5 Flash',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I am here for you. Based on your profile (${currentUser?.blood_group || 'O-Negative'}, Allergy: ${currentUser?.allergies || 'Penicillin, NSAIDs'}), remember to avoid Ibuprofen/Aspirin. Rest well and stay hydrated.`,
          model_used: 'Gemini AI Offline Mode',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat cleared. How can I help you today, ${currentUser?.name || 'Rohan'}?`,
        model_used: 'Google Gemini 2.5 Flash',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-4xl mx-auto w-full p-3 sm:p-6">
      {/* Chat Top Banner */}
      <div className="glass-panel rounded-3xl p-4 mb-4 shadow-xl border border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg glow-cyan">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Dr. Gemini AI Clinical Assistant
              </h2>
              <span className="text-[10px] bg-cyan-950/90 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-cyan-400" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Allergy-safe clinical advisor monitoring: <strong className="text-rose-400">{currentUser?.allergies || 'Penicillin, NSAIDs'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl glass-panel hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-slate-700/60 active:scale-95"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 glass-panel rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-inner border border-slate-800/90">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-xl relative group text-xs ${
                  isUser
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm glow-blue'
                    : 'glass-panel border border-slate-700/70 text-slate-100 rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</div>

                <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-white/10 text-[10px] opacity-75 font-mono">
                  <span>{msg.model_used ? msg.model_used : msg.time}</span>
                  <div className="flex items-center gap-2.5">
                    {!isUser && (
                      <button
                        onClick={() => toggleSpeak(msg.content, idx)}
                        className="hover:text-cyan-400 transition flex items-center gap-1"
                        title="Read Message Aloud"
                      >
                        {activeSpeechIndex === idx ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="hover:text-cyan-400 transition"
                      title="Copy Message"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    </button>
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 p-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="glass-panel border border-slate-700/70 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span className="font-semibold text-slate-300">Dr. Gemini is analyzing with Gemini 2.5 Flash API...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <button
          onClick={() => handleSendMessage("I have a slight fever and headache, what can I take safely?")}
          className="whitespace-nowrap px-3.5 py-1.5 glass-panel hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-full text-[11px] font-bold transition hover:border-cyan-500/40 shadow-sm active:scale-95"
        >
          💊 Fever & Headache relief?
        </button>
        <button
          onClick={() => handleSendMessage("What diet can help improve my hemoglobin and energy naturally?")}
          className="whitespace-nowrap px-3.5 py-1.5 glass-panel hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-full text-[11px] font-bold transition hover:border-emerald-500/40 shadow-sm active:scale-95"
        >
          🥗 Foods to boost hemoglobin?
        </button>
        <button
          onClick={() => handleSendMessage("Can you explain my O-Negative blood group benefits and precautions?")}
          className="whitespace-nowrap px-3.5 py-1.5 glass-panel hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-full text-[11px] font-bold transition hover:border-rose-500/40 shadow-sm active:scale-95"
        >
          🩸 Explain my O-Negative blood?
        </button>
        <button
          onClick={() => handleSendMessage("How should I manage asthma symptoms during weather changes?")}
          className="whitespace-nowrap px-3.5 py-1.5 glass-panel hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-full text-[11px] font-bold transition hover:border-purple-500/40 shadow-sm active:scale-95"
        >
          🫁 Asthma seasonal care?
        </button>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="glass-panel border border-slate-700/80 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-2xl"
      >
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2.5 rounded-xl transition ${
            isListening 
              ? 'bg-rose-500 text-white animate-pulse glow-red' 
              : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Voice Speech-To-Text"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Dr. Gemini any health or allergy question..."
          className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
        />

        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl transition flex items-center gap-1.5 text-xs shadow-md glow-cyan disabled:opacity-40 active:scale-95"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
