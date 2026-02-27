import joblib
import numpy as np
import pandas as pd
import sys
import os

# ==========================================
# IMPORT PREPROCESSING
# ==========================================

sys.path.append(os.path.abspath(".."))

from utils.preprocessing import preprocess_heart
from utils.preprocessing_diabetes import preprocess_diabetes
from utils.preprocessing_stroke import preprocess_stroke

# ==========================================
# LOAD BASE CLINICAL MODELS
# ==========================================

heart_model = joblib.load("../heart/heart_model.pkl")["model"]
diabetes_model = joblib.load("../diabetes/diabetes_model.pkl")["model"]
stroke_model = joblib.load("../stroke/stroke_model.pkl")["model"]

# ==========================================
# LOAD SIGNAL MODELS
# ==========================================

ecg_model = joblib.load("../ECG_model.pkl")
eeg_model = joblib.load("../EEG_model.pkl")
emg_model = joblib.load("../EMG_model.pkl")

# ==========================================
# LOAD META MODEL
# ==========================================

meta_data = joblib.load("meta_model.pkl")
meta_model = meta_data["model"]
label_encoder = meta_data["label_encoder"]

# ==========================================
# DISEASE MAPPING
# ==========================================

disease_names = {
    0: "Coronary Heart Disease",
    1: "Stroke",
    2: "Diabetes",
    3: "Hypertension",
    4: "Arrhythmia",
    11: "Metabolic Syndrome",
    12: "Neurological Disorder"
}

# ==========================================
# RAW PATIENT INPUT
# ==========================================

patient_input = {
    "BP": 190,
    "HeartRate": 120,
    "Glucose": 300,
    "SpO2": 88,
    "Sleep": 2,
    "Steps": 500
}

input_df = pd.DataFrame([patient_input])

# ==========================================
# APPLY TRAINING PREPROCESSING
# ==========================================

heart_input = preprocess_heart(input_df.copy())
diabetes_input = preprocess_diabetes(input_df.copy())
stroke_input = preprocess_stroke(input_df.copy())

# ==========================================
# CLINICAL MODEL OUTPUTS
# ==========================================

heart_prob = heart_model.predict_proba(heart_input)[0][1]
diabetes_prob = diabetes_model.predict_proba(diabetes_input)[0][1]
stroke_prob = stroke_model.predict_proba(stroke_input)[0][1]

# ==========================================
# BUILD SIGNAL FEATURES CORRECTLY
# ==========================================

heart_rate = patient_input["HeartRate"]
hrv_sdnn = 100 - heart_rate * 0.5
stress_ratio = patient_input["BP"] / patient_input["HeartRate"]
emg_rms = patient_input["Steps"] / 10000

# ECG expects 2 features
ecg_features = np.array([[heart_rate, hrv_sdnn]])

# EEG expects 1 feature
eeg_features = np.array([[stress_ratio]])

# EMG expects 1 feature
emg_features = np.array([[emg_rms]])

# ==========================================
# SIGNAL MODEL OUTPUTS
# ==========================================

ecg_prob = ecg_model.predict_proba(ecg_features)[0][1]
eeg_prob = eeg_model.predict_proba(eeg_features)[0][1]
emg_prob = emg_model.predict_proba(emg_features)[0][1]

# ==========================================
# STATIC RISK FUSION
# ==========================================

static_risk = (
    0.30 * heart_prob +
    0.25 * diabetes_prob +
    0.20 * stroke_prob +
    0.15 * ecg_prob +
    0.10 * eeg_prob
)

# ==========================================
# META FEATURE ENGINEERING
# ==========================================

cardio_combined = (heart_prob + ecg_prob) / 2
neuro_combined = (stroke_prob + eeg_prob) / 2
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

# ==========================================
# PREPARE META INPUT
# ==========================================

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

# ==========================================
# META MODEL PREDICTION
# ==========================================

probabilities = meta_model.predict_proba(meta_input)[0]
predicted_encoded = meta_model.predict(meta_input)[0]
predicted_original = label_encoder.inverse_transform([predicted_encoded])[0]

predicted_disease = disease_names.get(predicted_original, "Unknown")

# ==========================================
# OUTPUT
# ==========================================

print("\n========== FULL PIPELINE RESULT ==========")
print("Heart Prob:", round(heart_prob, 4))
print("Diabetes Prob:", round(diabetes_prob, 4))
print("Stroke Prob:", round(stroke_prob, 4))
print("ECG Prob:", round(ecg_prob, 4))
print("EEG Prob:", round(eeg_prob, 4))
print("EMG Prob:", round(emg_prob, 4))
print("Static Risk:", round(static_risk, 4))
print("NCM Index:", round(ncm_index, 2))
print("\nFinal Predicted Disease:", predicted_disease)
print("Confidence:", round(np.max(probabilities), 4))
print("==========================================")