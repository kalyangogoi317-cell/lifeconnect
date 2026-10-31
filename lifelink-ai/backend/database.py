import json
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(DATABASE_DIR, "lifelink.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import PatientProfile, Prescription, SOSLog, User, hash_password
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check and seed Users table
        user_count = db.query(User).count()
        if user_count == 0:
            demo_patient = User(
                name="Rohan Sharma",
                email="rohan@lifelink.ai",
                password_hash=hash_password("password123"),
                role="patient",
                blood_group="O-Negative",
                allergies="Penicillin, NSAIDs (Ibuprofen)",
                chronic_conditions="Asthma, Mild Hypertension",
                medications="Salbutamol Inhaler",
                emergency_contact="+91-9876543210 (Father)"
            )
            demo_doctor = User(
                name="Dr. Arvind Sen, MD",
                email="doctor@hospital.org",
                password_hash=hash_password("doctor123"),
                role="doctor",
                blood_group="B-Positive",
                allergies="None reported",
                chronic_conditions="None reported",
                medications="",
                emergency_contact="+91-9988776655 (Hospital Emergency Desk)"
            )
            db.add(demo_patient)
            db.add(demo_doctor)
            db.commit()
            print("[Database] Seeded demo users: rohan@lifelink.ai & doctor@hospital.org")

        # Check and seed PatientProfile
        profile_count = db.query(PatientProfile).count()
        if profile_count == 0:
            default_patient = PatientProfile(
                user_id=1,
                name="Rohan Sharma",
                age=24,
                blood_group="O-Negative",
                allergies="Penicillin, NSAIDs (Ibuprofen)",
                chronic_conditions="Asthma, Mild Hypertension",
                medications="Salbutamol Inhaler",
                emergency_contact="+91-9876543210 (Dr. Sharma / Father)"
            )
            db.add(default_patient)
            db.commit()
            db.refresh(default_patient)
            print("[Database] Seeded default patient profile: Rohan Sharma (O-Negative)")

        # Prescriptions are NOT pre-seeded: Timetable only shows medicines from prescriptions uploaded by the user!

        # Check and seed 1 sample SOS log
        sos_count = db.query(SOSLog).count()
        if sos_count == 0:
            sample_sos = SOSLog(
                patient_id=1,
                gps_lat=28.6139,
                gps_lng=77.2090,
                triage_level="HIGH",
                detected_condition="Acute Severe Asthma Exacerbation with Dyspnea",
                patient_voice_guidance="Sit upright in a comfortable position and use your Salbutamol inhaler immediately. Stay calm and breathe slowly. ER dispatch is alert with your O-Negative blood group and Penicillin allergy.",
                hospital_dispatch_json=json.dumps({
                    "patient_name": "Rohan Sharma",
                    "blood_group": "O-Negative",
                    "critical_allergies": ["Penicillin", "NSAIDs (Ibuprofen)"],
                    "chronic_risks": ["Asthma", "Mild Hypertension"],
                    "suspected_injuries": ["Acute Respiratory Distress", "Wheezing / Bronchospasm"],
                    "recommended_prep": "Prepare high-flow oxygen, nebulized albuterol/ipratropium, avoid NSAIDs, keep O-Neg blood ready on stand-by."
                }),
                snapshot_base64="",
                audio_transcript="I am having trouble breathing, chest feels tight, inhaler only partially helping.",
                created_at=datetime.utcnow()
            )
            db.add(sample_sos)
            db.commit()
            print("[Database] Seeded initial SOS dispatch log for ER Dashboard")
    except Exception as e:
        print(f"[Database Error during init_db]: {e}")
        db.rollback()
    finally:
        db.close()
