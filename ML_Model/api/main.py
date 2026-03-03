from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import sys

# Allow importing preprocessing
sys.path.append(os.path.abspath("../"))
from utils.preprocessing import (
    preprocess_heart,
    preprocessing_stroke,
    preprocess_ecg,
    preprocess_eeg,
    preprocess_emg
)

from utils.preprocessing_diabetes import preprocess_diabetes

app = FastAPI(
    title="Dhanvantari Multi-Disease Prediction API",
    description="Comprehensive health risk prediction using ML models",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# Load Models
# ===============================
try:
    heart_data = joblib.load("../heart/heart_model.pkl")
    diabetes_data = joblib.load("../diabetes/diabetes_model.pkl")
    stroke_data = joblib.load("../stroke/stroke_model.pkl")
    ecg_data = joblib.load("../ECG/ECG_model.pkl")
    eeg_data = joblib.load("../EEG/EEG_model.pkl")
    emg_data = joblib.load("../EMG/EMG_model.pkl")
    
    # Extract models and thresholds
    heart_model = heart_data["model"]
    heart_threshold = heart_data["threshold"]
    
    diabetes_model = diabetes_data["model"]
    diabetes_threshold = diabetes_data["threshold"]
    
    stroke_model = stroke_data["model"]
    stroke_scaler = stroke_data.get("scaler")  # Stroke model has scaler instead of threshold
    stroke_threshold = 0.5  # Default threshold for stroke
    
    ecg_model = ecg_data["model"]
    ecg_threshold = ecg_data["threshold"]
    
    eeg_model = eeg_data["model"]
    eeg_threshold = eeg_data["threshold"]
    
    emg_model = emg_data["model"]
    emg_threshold = emg_data["threshold"]
    
    print("✅ All models loaded successfully!")
    
except Exception as e:
    print(f"⚠️ Error loading models: {e}")
    raise

# ===============================
# Request Schema
# ===============================
class PatientInput(BaseModel):
    BP: float
    HeartRate: float
    Glucose: float
    SpO2: float
    Sleep: float
    Steps: float
    hrv_sdnn: float = 50.0  # Optional: HRV for ECG
    stress_ratio: float = 0.5  # Optional: Stress ratio for EEG
    emg_rms: float = 0.5  # Optional: EMG RMS value

class HealthResponse(BaseModel):
    heart: dict
    diabetes: dict
    stroke: dict
    ecg: dict
    eeg: dict
    emg: dict
    overall_risk: str
    risk_score: float

# ===============================
# Prediction Endpoint
# ===============================
@app.post("/predict", response_model=HealthResponse)
def predict(data: PatientInput):
    try:
        df = pd.DataFrame([data.dict()])
        
        # Create base dataframe with only core features (exclude signal-specific features)
        base_df = df[["BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps"]].copy()
        
        # --------------------
        # HEART DISEASE
        # --------------------
        heart_df = preprocess_heart(base_df.copy())
        heart_prob = heart_model.predict_proba(heart_df)[0][1]
        heart_pred = int(heart_prob > heart_threshold)
        
        # --------------------
        # DIABETES
        # --------------------
        diabetes_df = preprocess_diabetes(base_df.copy())
        diabetes_prob = diabetes_model.predict_proba(diabetes_df)[0][1]
        diabetes_pred = int(diabetes_prob > diabetes_threshold)
        
        # --------------------
        # STROKE
        # --------------------
        stroke_df = preprocessing_stroke(base_df.copy())
        stroke_prob = stroke_model.predict_proba(stroke_df)[0][1]
        stroke_pred = int(stroke_prob > stroke_threshold)
        
        # --------------------
        # ECG (Heart Signal)
        # --------------------
        ecg_df = preprocess_ecg(df.copy())
        ecg_prob = ecg_model.predict_proba(ecg_df)[0][1]
        ecg_pred = int(ecg_prob > ecg_threshold)
        
        # --------------------
        # EEG (Brain Activity)
        # --------------------
        eeg_df = preprocess_eeg(df.copy())
        eeg_prob = eeg_model.predict_proba(eeg_df)[0][1]
        eeg_pred = int(eeg_prob > eeg_threshold)
        
        # --------------------
        # EMG (Muscle Activity)
        # --------------------
        emg_df = preprocess_emg(df.copy())
        emg_prob = emg_model.predict_proba(emg_df)[0][1]
        emg_pred = int(emg_prob > emg_threshold)
        
        # --------------------
        # Calculate Overall Risk
        # --------------------
        risk_scores = [heart_prob, diabetes_prob, stroke_prob, ecg_prob, eeg_prob, emg_prob]
        avg_risk = np.mean(risk_scores)
        
        if avg_risk < 0.3:
            overall_risk = "LOW"
        elif avg_risk < 0.6:
            overall_risk = "MODERATE"
        else:
            overall_risk = "HIGH"
        
        return {
            "heart": {
                "probability": float(heart_prob),
                "risk": heart_pred,
                "status": "High Risk" if heart_pred == 1 else "Normal"
            },
            "diabetes": {
                "probability": float(diabetes_prob),
                "risk": diabetes_pred,
                "status": "High Risk" if diabetes_pred == 1 else "Normal"
            },
            "stroke": {
                "probability": float(stroke_prob),
                "risk": stroke_pred,
                "status": "High Risk" if stroke_pred == 1 else "Normal"
            },
            "ecg": {
                "probability": float(ecg_prob),
                "risk": ecg_pred,
                "status": "Abnormal" if ecg_pred == 1 else "Normal"
            },
            "eeg": {
                "probability": float(eeg_prob),
                "risk": eeg_pred,
                "status": "Abnormal" if eeg_pred == 1 else "Normal"
            },
            "emg": {
                "probability": float(emg_prob),
                "risk": emg_pred,
                "status": "Abnormal" if emg_pred == 1 else "Normal"
            },
            "overall_risk": overall_risk,
            "risk_score": float(avg_risk)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/")
def home():
    return {
        "message": "🏥 Dhanvantari Multi-Disease Prediction API",
        "version": "2.0.0",
        "models": ["Heart", "Diabetes", "Stroke", "ECG", "EEG", "EMG"],
        "endpoints": {
            "/predict": "POST - Make predictions",
            "/health": "GET - Check API health",
            "/docs": "GET - API documentation"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": 6,
        "models": {
            "heart": "✅",
            "diabetes": "✅",
            "stroke": "✅",
            "ecg": "✅",
            "eeg": "✅",
            "emg": "✅"
        }
    }