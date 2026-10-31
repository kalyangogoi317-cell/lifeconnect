import json
import os
from datetime import datetime
from typing import List, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import engine, get_db, init_db
from models import PatientProfile, Prescription, SOSLog, User, hash_password, verify_password
from ai_router import run_hybrid_vision_ai, run_gemini_chat, run_gemma_chat

app = FastAPI(
    title="LifeLink AI - Healthcare Platform",
    description="Emergency SOS, Doctor Prescription OCR, Lab Report Simplifier, and Gemini 2.5 Flash AI Chat",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    print("[LifeLink AI] Backend initialized with Google Gemini 2.5 Flash API.")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

manager = ConnectionManager()


@app.websocket("/ws/sos")
async def websocket_sos_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Schemas
class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "patient"
    age: Optional[int] = 24
    blood_group: Optional[str] = "O-Negative"
    allergies: Optional[str] = ""
    chronic_conditions: Optional[str] = ""
    medications: Optional[str] = ""
    emergency_contact: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    medications: Optional[str] = None
    emergency_contact: Optional[str] = None

class SOSRequest(BaseModel):
    patient_id: Optional[int] = 1
    gps_lat: float = 28.6139
    gps_lng: float = 77.2090
    snapshot_base64: Optional[str] = ""
    audio_transcript: Optional[str] = ""

class PrescriptionAnalyzeRequest(BaseModel):
    image_base64: str
    patient_id: Optional[int] = 1

class PrescriptionVerifyRequest(BaseModel):
    medicines: List[dict]
    doctor_notes: Optional[str] = None

class ReportAnalyzeRequest(BaseModel):
    image_base64: str

class ChatRequest(BaseModel):
    messages: List[dict]
    patient_context: Optional[dict] = None


# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.post("/api/auth/signup")
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please Sign In."
        )

    new_user = User(
        name=req.name.strip(),
        email=clean_email,
        password_hash=hash_password(req.password),
        role="patient",
        blood_group=req.blood_group or "O-Negative",
        allergies=req.allergies or "",
        chronic_conditions=req.chronic_conditions or "",
        medications=req.medications or "",
        emergency_contact=req.emergency_contact or "",
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = PatientProfile(
        user_id=new_user.id,
        name=new_user.name,
        age=req.age or 24,
        blood_group=new_user.blood_group,
        allergies=new_user.allergies,
        chronic_conditions=new_user.chronic_conditions,
        medications=new_user.medications,
        emergency_contact=new_user.emergency_contact
    )
    db.add(profile)
    db.commit()

    return {
        "success": True,
        "message": "Account created successfully! Welcome to LifeLink AI.",
        "user": new_user.to_dict()
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )

    return {
        "success": True,
        "message": f"Welcome back, {user.name}!",
        "user": user.to_dict()
    }


# ==========================================
# GOOGLE GEMINI 2.5 FLASH AI HEALTH CHAT ENDPOINT
# ==========================================

@app.post("/api/chat")
async def chat_with_gemini(req: ChatRequest, db: Session = Depends(get_db)):
    context = req.patient_context
    if not context:
        profile = db.query(PatientProfile).first()
        if profile:
            context = profile.to_dict()

    result = await run_gemini_chat(req.messages, context)
    return result


# ==========================================
# CORE LIFELINK HEALTHCARE API ROUTES
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "LifeLink AI Core Backend (Google Gemini 2.5 Flash API Enabled)",
        "timestamp": datetime.utcnow().isoformat(),
        "active_er_websockets": len(manager.active_connections)
    }


@app.get("/api/profile")
def get_patient_profile(patient_id: int = 1, db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return profile.to_dict()


@app.put("/api/profile")
def update_patient_profile(req: ProfileUpdateRequest, patient_id: int = 1, db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    if req.name is not None:
        profile.name = req.name
    if req.age is not None:
        profile.age = req.age
    if req.blood_group is not None:
        profile.blood_group = req.blood_group
    if req.allergies is not None:
        profile.allergies = req.allergies
    if req.chronic_conditions is not None:
        profile.chronic_conditions = req.chronic_conditions
    if req.medications is not None:
        profile.medications = req.medications
    if req.emergency_contact is not None:
        profile.emergency_contact = req.emergency_contact

    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully", "profile": profile.to_dict()}


@app.post("/api/trigger-sos")
async def trigger_emergency_sos(req: SOSRequest, db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.id == req.patient_id).first()
    patient_info_str = "Unknown Patient"
    blood_group = "Unknown"
    allergies = "None reported"
    chronic = "None reported"
    if profile:
        patient_info_str = f"Name: {profile.name}, Age: {profile.age}, Blood: {profile.blood_group}, Allergies: {profile.allergies}, Chronic: {profile.chronic_conditions}"
        blood_group = profile.blood_group
        allergies = profile.allergies
        chronic = profile.chronic_conditions

    system_prompt = (
        "You are the LifeLink AI Emergency Medical Triage Specialist. Analyze the emergency audio transcript, "
        "visual snapshot, and patient medical profile. Provide an immediate triage level (CRITICAL, HIGH, MODERATE), "
        "detected condition, concise calm voice guidance for the patient (under 3 sentences), "
        "and a structured hospital dispatch payload highlighting blood group, critical allergies, and prep instructions."
    )
    user_prompt = (
        f"Patient Medical Profile: {patient_info_str}\n"
        f"Patient Speech/Transcript: {req.audio_transcript}\n"
        f"GPS Coordinates: Lat {req.gps_lat}, Lng {req.gps_lng}\n"
    )

    ai_result = await run_hybrid_vision_ai(
        task_type="sos",
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        image_base64=req.snapshot_base64 if req.snapshot_base64 else None
    )

    triage_level = ai_result.get("triage_level", "CRITICAL")
    detected_condition = ai_result.get("detected_condition", "Acute Trauma / Distress")
    voice_guidance = ai_result.get(
        "patient_voice_guidance",
        "Keep calm. Apply pressure if bleeding. Responders alerted with your blood group profile."
    )
    dispatch_payload = ai_result.get("hospital_dispatch_payload", {
        "patient_name": profile.name if profile else "Unknown",
        "blood_group": blood_group,
        "critical_allergies": [allergies],
        "chronic_risks": [chronic],
        "suspected_injuries": [detected_condition],
        "recommended_prep": f"Prepare ER bay. Stand by {blood_group} blood."
    })

    sos_log = SOSLog(
        patient_id=req.patient_id or 1,
        gps_lat=req.gps_lat,
        gps_lng=req.gps_lng,
        triage_level=triage_level,
        detected_condition=detected_condition,
        patient_voice_guidance=voice_guidance,
        hospital_dispatch_json=json.dumps(dispatch_payload),
        snapshot_base64=req.snapshot_base64 or "",
        audio_transcript=req.audio_transcript or "",
        created_at=datetime.utcnow()
    )
    db.add(sos_log)
    db.commit()
    db.refresh(sos_log)

    log_dict = sos_log.to_dict()

    broadcast_msg = {
        "type": "NEW_SOS_ALERT",
        "alert": log_dict,
        "patient": profile.to_dict() if profile else {
            "name": "Patient",
            "blood_group": blood_group,
            "allergies": allergies,
            "chronic_conditions": chronic
        }
    }
    await manager.broadcast(broadcast_msg)

    return {
        "success": True,
        "sos_id": sos_log.id,
        "triage_level": triage_level,
        "detected_condition": detected_condition,
        "patient_voice_guidance": voice_guidance,
        "hospital_dispatch_payload": dispatch_payload,
        "created_at": log_dict["created_at"]
    }


@app.post("/api/analyze-prescription")
async def analyze_prescription(req: PrescriptionAnalyzeRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "You are an expert Clinical Pharmacologist and Doctor Handwriting OCR Specialist. "
        "Your task is to transcribe and accurately extract every single prescribed medicine, tablet, capsule, injection, or syrup from the image. "
        "Clinical instructions: "
        "1. Identify the medicine name (brand or generic salt) and dosage/strength (e.g. 500mg, 650mg, 40mg, 1 tab, 5ml). "
        "2. Parse timing schedules: '1-0-1' means ['Morning', 'Night']; '1-1-1' or 'TDS' means ['Morning', 'Afternoon', 'Night']; "
        "'1-0-0' or 'OD' or 'Morning' means ['Morning']; '0-0-1' or 'HS' or 'Night' means ['Night']; '0-1-0' means ['Afternoon']. "
        "3. Parse meal relation: 'Before Food' (or AC, empty stomach, BBF), 'After Food' (or PC, after lunch/dinner). "
        "4. Duration in days (e.g. 3, 5, 7, 10, 14, 30). "
        "Strictly output JSON with keys: doctor_notes (string summarizing patient diagnosis or doctor notes) "
        "and medicines (array of objects with keys: medicine_name, dosage, timing [list among Morning, Afternoon, Night], meal_relation ['Before Food' or 'After Food'], duration_days (integer), confidence (string))."
    )
    user_prompt = "Transcribe and extract the prescription medicines and schedules with high clinical precision from this prescription photo."

    ai_result = await run_hybrid_vision_ai(
        task_type="prescription",
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        image_base64=req.image_base64
    )

    doctor_notes = ai_result.get("doctor_notes", "Handwritten prescription decoded.")
    medicines = ai_result.get("medicines", [])

    formatted_medicines = []
    for m in medicines:
        formatted_medicines.append({
            "medicine_name": m.get("medicine_name", "Medicine"),
            "dosage": m.get("dosage", "1 dose"),
            "timing": m.get("timing", ["Morning"]),
            "meal_relation": m.get("meal_relation", "After Food"),
            "duration_days": m.get("duration_days", 5),
            "confidence": m.get("confidence", "95%"),
            "taken_today": False
        })

    new_prescription = Prescription(
        patient_id=req.patient_id or 1,
        image_base64=req.image_base64,
        doctor_notes=doctor_notes,
        medicines_json=json.dumps(formatted_medicines),
        doctor_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription.to_dict()


@app.put("/api/prescriptions/{prescription_id}/verify")
def verify_prescription(prescription_id: int, req: PrescriptionVerifyRequest, db: Session = Depends(get_db)):
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription.medicines_json = json.dumps(req.medicines)
    if req.doctor_notes:
        prescription.doctor_notes = req.doctor_notes
    prescription.doctor_verified = True

    db.commit()
    db.refresh(prescription)
    return {
        "message": "Prescription scheduled successfully into timetable.",
        "prescription": prescription.to_dict()
    }


@app.get("/api/prescriptions")
def get_prescriptions(
    patient_id: Optional[int] = None,
    verified_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Prescription)
    if patient_id is not None:
        query = query.filter(Prescription.patient_id == patient_id)
    if verified_only:
        query = query.filter(Prescription.doctor_verified == True)
    
    prescriptions = query.order_by(Prescription.created_at.desc()).all()
    return [p.to_dict() for p in prescriptions]


@app.delete("/api/prescriptions/{prescription_id}")
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    db.delete(prescription)
    db.commit()
    return {"success": True, "message": "Prescription deleted successfully."}


@app.delete("/api/prescriptions")
def clear_all_prescriptions(patient_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Prescription)
    if patient_id is not None:
        query = query.filter(Prescription.patient_id == patient_id)
    query.delete()
    db.commit()
    return {"success": True, "message": "All prescriptions cleared."}


@app.put("/api/prescriptions/{prescription_id}/toggle-taken")
def toggle_medicine_taken(prescription_id: int, medicine_index: int, db: Session = Depends(get_db)):
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    meds = json.loads(prescription.medicines_json or "[]")
    if 0 <= medicine_index < len(meds):
        meds[medicine_index]["taken_today"] = not meds[medicine_index].get("taken_today", False)
        prescription.medicines_json = json.dumps(meds)
        db.commit()
        db.refresh(prescription)
    return prescription.to_dict()


@app.post("/api/analyze-report")
async def analyze_medical_report(req: ReportAnalyzeRequest):
    system_prompt = (
        "You are an expert clinical AI Diagnostic Specialist powered by Google Gemini 2.5 Flash Vision. "
        "Analyze this medical lab report / pathology test image thoroughly. "
        "Extract every single test parameter with its measured value, reference range, and status (NORMAL, HIGH, LOW, CRITICAL). "
        "Provide an overall clinical summary, actionable diet and lifestyle tips, and a simple, comforting "
        "patient explanation in natural English + Hinglish designed for patient text-to-speech voice readout."
    )
    user_prompt = (
        "Analyze this medical lab report image. Identify all investigations, values, reference ranges, "
        "flags (NORMAL, HIGH, LOW, CRITICAL), and return structured JSON matching the schema."
    )

    ai_result = await run_hybrid_vision_ai(
        task_type="report",
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        image_base64=req.image_base64
    )

    # Format structured extracted text for UI preview
    params = ai_result.get("parameters", [])
    extracted_summary = "GOOGLE GEMINI 2.5 FLASH MULTIMODAL VISION REPORT EXTRACTION\n"
    extracted_summary += "=" * 70 + "\n"
    extracted_summary += f"{'INVESTIGATION':<32} {'RESULT':<15} {'REFERENCE':<15} {'STATUS'}\n"
    extracted_summary += "-" * 70 + "\n"
    for p in params:
        extracted_summary += f"{p.get('name', 'Test'):<32} {p.get('value', ''):<15} {p.get('reference_range', ''):<15} [{p.get('status', 'NORMAL')}]\n"

    ai_result["extracted_ocr_text"] = extracted_summary
    ai_result["ocr_model"] = "Google Gemini 2.5 Flash (Multimodal Vision API)"
    ai_result["analysis_model"] = "Gemini 2.5 Flash Clinical Diagnostic Engine"
    return ai_result
