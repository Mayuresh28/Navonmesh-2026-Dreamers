from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import sys
import os

# =====================================================
# APP INIT
# =====================================================

app = FastAPI(title="Medical AI Diagnostic API")

sys.path.append(os.path.abspath("."))

# =====================================================
# IMPORT PREPROCESSING
# =====================================================

from utils.preprocessing import preprocess_heart
from utils.preprocessing_diabetes import preprocess_diabetes
from utils.preprocessing_stroke import preprocess_stroke

# =====================================================
# LOAD MODELS
# =====================================================

heart_model = joblib.load("heart/heart_model.pkl")["model"]
diabetes_model = joblib.load("diabetes/diabetes_model.pkl")["model"]
stroke_model = joblib.load("stroke/stroke_model.pkl")["model"]

ecg_data = joblib.load("./ECG/ECG_model.pkl")
eeg_data = joblib.load("./EEG/EEG_model.pkl")
emg_data = joblib.load("./EMG/EMG_model.pkl")

ecg_model = ecg_data["model"]
eeg_model = eeg_data["model"]
emg_model = emg_data["model"]

meta_data = joblib.load("./meta/meta_model.pkl")
meta_model = meta_data["model"]
label_encoder = meta_data["label_encoder"]

# =====================================================
# DISEASE MAP
# =====================================================

disease_names = {
    0: "Coronary Heart Disease",
    1: "Stroke",
    2: "Diabetes",
    3: "Hypertension",
    4: "Arrhythmia",
    5: "Metabolic Syndrome",
    6: "General Neurological Disorder",
    7: "Epilepsy",
    8: "No Significant Disease"
}

# =====================================================
# INPUT SCHEMA
# =====================================================

class PatientInput(BaseModel):
    BP: float
    HeartRate: float
    Glucose: float
    SpO2: float
    Sleep: float
    Steps: float


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {"status": "Medical AI API running"}


# =====================================================
# PREDICT
# =====================================================

@app.post("/predict")
def predict(data: PatientInput):

    patient_input = data.dict()
    input_df = pd.DataFrame([patient_input])

    # =================================================
    # APPLY TRAINING PREPROCESSING
    # =================================================

    heart_input = preprocess_heart(input_df.copy())
    diabetes_input = preprocess_diabetes(input_df.copy())
    stroke_input = preprocess_stroke(input_df.copy())

    heart_prob = heart_model.predict_proba(heart_input)[0][1]
    diabetes_prob = diabetes_model.predict_proba(diabetes_input)[0][1]
    stroke_prob = stroke_model.predict_proba(stroke_input)[0][1]

    # =================================================
    # SIGNAL FEATURES (FIXED SHAPES)
    # =================================================

    heart_rate = patient_input["HeartRate"]
    sleep_hours = patient_input["Sleep"]
    steps = patient_input["Steps"]

    hrv_sdnn = 100 - heart_rate * 0.5
    stress_ratio = patient_input["BP"] / max(heart_rate, 1)
    emg_rms = steps / 10000

    # ECG expects 2 features
    ecg_features = np.array([[heart_rate, hrv_sdnn]])

    # EEG expects 2 features
    eeg_features = np.array([[stress_ratio, sleep_hours]])

    # EMG expects 2 features
    emg_features = np.array([[emg_rms, steps]])

    ecg_prob = ecg_model.predict_proba(ecg_features)[0][1]
    eeg_prob = eeg_model.predict_proba(eeg_features)[0][1]
    emg_prob = emg_model.predict_proba(emg_features)[0][1]

    # =================================================
    # FUSION
    # =================================================

    static_risk = (
        0.30 * heart_prob +
        0.25 * diabetes_prob +
        0.20 * stroke_prob +
        0.15 * ecg_prob +
        0.10 * eeg_prob
    )

    cardio_combined = (heart_prob + ecg_prob) / 2
    neuro_combined = (stroke_prob + eeg_prob + emg_prob) / 3
    metabolic_combined = (diabetes_prob + static_risk) / 2
    fatigue_index = (emg_prob + eeg_prob) / 2

    ncm_index = (
        0.25 * heart_prob +
        0.20 * diabetes_prob +
        0.20 * stroke_prob +
        0.15 * ecg_prob +
        0.10 * eeg_prob +
        0.10 * static_risk
    ) * 100

    meta_input = np.array([[
        heart_prob,
        diabetes_prob,
        stroke_prob,
        ecg_prob,
        eeg_prob,
        emg_prob,
        static_risk,
        ncm_index,
        cardio_combined,
        neuro_combined,
        metabolic_combined,
        fatigue_index
    ]])

    probabilities = meta_model.predict_proba(meta_input)[0]
    predicted_encoded = meta_model.predict(meta_input)[0]
    predicted_original = label_encoder.inverse_transform([predicted_encoded])[0]
    meta_confidence = float(np.max(probabilities))

    # =================================================
    # PRIORITY RULES
    # =================================================

    final_class = predicted_original

    if stroke_prob > 0.90 and patient_input["BP"] > 170:
        final_class = 1

    elif diabetes_prob > 0.90 and patient_input["Glucose"] > 200:
        final_class = 2

    elif heart_prob > 0.85 and ecg_prob > 0.85:
        final_class = 0

    elif ecg_prob > 0.92 and heart_prob < 0.70:
        final_class = 4

    elif eeg_prob > 0.90 and emg_prob > 0.75:
        final_class = 7

    elif static_risk < 0.20 and all([
        heart_prob < 0.40,
        diabetes_prob < 0.40,
        stroke_prob < 0.40,
        ecg_prob < 0.40,
        eeg_prob < 0.40,
        emg_prob < 0.40
    ]):
        final_class = 8

    # Confidence fallback
    if meta_confidence < 0.60:
        system_scores = {
            0: cardio_combined,
            1: stroke_prob,
            2: diabetes_prob,
            3: static_risk,
            4: ecg_prob,
            5: metabolic_combined,
            6: neuro_combined,
            7: (eeg_prob + emg_prob) / 2,
            8: 1 - static_risk
        }
        final_class = max(system_scores, key=system_scores.get)

    predicted_disease = disease_names.get(final_class, "Unknown")

    return {
        "final_diagnosis": predicted_disease,
        "confidence": round(meta_confidence, 4),
        "risk_breakdown": {
            "heart": round(float(heart_prob), 4),
            "diabetes": round(float(diabetes_prob), 4),
            "stroke": round(float(stroke_prob), 4),
            "ecg": round(float(ecg_prob), 4),
            "eeg": round(float(eeg_prob), 4),
            "emg": round(float(emg_prob), 4)
        }
    }