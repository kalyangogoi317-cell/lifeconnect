import hashlib
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime
from database import Base

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed: str) -> bool:
    return hash_password(plain_password) == hashed


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="patient")  # "patient" or "doctor"
    blood_group = Column(String(20), default="O-Negative")
    allergies = Column(Text, default="")
    chronic_conditions = Column(Text, default="")
    medications = Column(Text, default="")
    emergency_contact = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "blood_group": self.blood_group,
            "allergies": self.allergies,
            "chronic_conditions": self.chronic_conditions,
            "medications": self.medications,
            "emergency_contact": self.emergency_contact,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    blood_group = Column(String(20), nullable=False)
    allergies = Column(Text, default="")
    chronic_conditions = Column(Text, default="")
    medications = Column(Text, default="")
    emergency_contact = Column(String(50), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "age": self.age,
            "blood_group": self.blood_group,
            "allergies": self.allergies,
            "chronic_conditions": self.chronic_conditions,
            "medications": self.medications,
            "emergency_contact": self.emergency_contact
        }


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, default=1)
    image_base64 = Column(Text, default="")
    doctor_notes = Column(Text, default="")
    medicines_json = Column(Text, default="[]")
    doctor_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        meds = []
        try:
            meds = json.loads(self.medicines_json) if self.medicines_json else []
        except Exception:
            meds = []
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "image_base64": self.image_base64,
            "doctor_notes": self.doctor_notes,
            "medicines": meds,
            "doctor_verified": self.doctor_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SOSLog(Base):
    __tablename__ = "sos_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, default=1)
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    triage_level = Column(String(50), default="CRITICAL")
    detected_condition = Column(String(255), default="Unknown Acute Incident")
    patient_voice_guidance = Column(Text, default="")
    hospital_dispatch_json = Column(Text, default="{}")
    snapshot_base64 = Column(Text, default="")
    audio_transcript = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        payload = {}
        try:
            payload = json.loads(self.hospital_dispatch_json) if self.hospital_dispatch_json else {}
        except Exception:
            payload = {}
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "triage_level": self.triage_level,
            "detected_condition": self.detected_condition,
            "patient_voice_guidance": self.patient_voice_guidance,
            "hospital_dispatch_payload": payload,
            "snapshot_base64": self.snapshot_base64,
            "audio_transcript": self.audio_transcript,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
