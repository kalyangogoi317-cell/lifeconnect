# LifeConnect (LifeLink AI) 🏥⚡

> **Personal Emergency & Healthcare AI Web Application** powered by **Google Gemini 2.5 Flash Vision API**, **FastAPI**, and **React (Vite)**.

[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20(Vite)-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Key Features

### 1. 🚨 One-Tap Emergency SOS
- Instant SOS trigger with real-time browser GPS coordinates.
- Sends bystander audio alert instructions and pre-populated hospital ER dispatch payload.
- Automatically shares emergency contact notifications and patient chronic condition/allergy warnings.

### 2. 💬 AI Health Chat (Dr. Gemini 2.5 Flash)
- Voice-enabled, multimodal AI health companion.
- Converses naturally in **Hinglish** and **English** with clinical caution.
- Considers user profile (blood group, allergies, chronic conditions) for personalized, safe answers.

### 3. 💊 Medicines & Prescription Scanner
- Scans handwritten or printed doctor prescription images using **Google Gemini 2.5 Flash Vision**.
- Extracts medicine names, exact dosage, meal relationship (*Before Food / After Food*), and course duration.
- Automatically schedules extracted medicines into **Morning (08:00 AM)**, **Afternoon (01:30 PM)**, and **Night (09:00 PM)** timetable slots.
- Interactive toggle to mark medicines as taken today.

### 4. 🔬 My Lab & Blood Report AI Simplifier
- Decodes complex medical lab reports and blood tests from photos.
- Multimodal OCR with animated laser scanline UI.
- Color-coded biomarker status cards (Normal, High, Low) with reference ranges.
- Built-in text-to-speech voice readout explaining lab results in plain, easy-to-understand Hinglish.

### 5. 🪪 Digital Titanium Medical ID Card
- Holographic emergency medical passport with a high-contrast QR code.
- Quick scan by paramedics or bystanders displays blood group, critical allergies, emergency contact phone, and chronic illnesses without unlocking the phone.

---

## 🏗️ Architecture

```
lifeconnect/
├── lifelink-ai/
│   ├── backend/                 # FastAPI REST API & Gemini Vision Router
│   │   ├── ai_router.py         # Google Gemini 2.5 Flash Vision & Chat Integration
│   │   ├── main.py              # REST API Endpoints & WebSocket Server
│   │   ├── database.py          # SQLAlchemy SQLite Engine & Session
│   │   ├── models.py            # User, Prescription, SOSLog Models
│   │   └── requirements.txt     # Python Dependencies
│   └── frontend/                # Vite React Application
│       ├── src/
│       │   ├── components/      # User-Centric Feature Modules
│       │   │   ├── auth/        # Login & Signup Screens
│       │   │   └── user/        # SOS, Chat, Prescriptions, Report Analyzer, Medical ID
│       │   ├── App.jsx          # Glassmorphism Obsidian Mesh Layout & Navigation
│       │   └── index.css        # Custom Glows, Scanlines & Glass Panels
│       ├── package.json
│       └── vite.config.js
├── start_lifelink.bat           # 1-Click Windows Batch Launcher
├── run_all_in_one_terminal.ps1  # Unified 1-Terminal PowerShell Launcher
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- A **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone git@github.com:kalyangogoi317-cell/lifeconnect.git
cd lifeconnect
```

### 2. Backend Setup
```bash
cd lifelink-ai/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. 1-Click Launch (Windows)
Double-click `start_lifelink.bat` or run:
```powershell
.\run_all_in_one_terminal.ps1
```

Or run manually in two terminals:
- **Backend:** `cd lifelink-ai/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000`
- **Frontend:** `cd lifelink-ai/frontend && npm run dev`

Open your browser at:
```
http://localhost:5173
```

---

## 🔐 Configuration & Environment Variables

You can configure your Gemini API Key in `ai_router.py` or set it in your environment:
```bash
export GEMINI_API_KEY="your_google_gemini_api_key_here"
# Windows PowerShell:
$env:GEMINI_API_KEY="your_google_gemini_api_key_here"
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
