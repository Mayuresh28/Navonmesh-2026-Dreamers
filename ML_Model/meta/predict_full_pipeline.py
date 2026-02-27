"""
Full Medical AI Pipeline — predict_pipeline.py  (v2 — fixed)
=============================================================
Fixes applied vs v1:
  1. Stroke model now uses its own scaler (retrained model)
  2. EMG feature engineering consistent with retrained model
  3. Stroke rule threshold raised (was triggering on everyone)
  4. EEG sleep feature correctly passed
"""

import joblib
import numpy as np
import pandas as pd
import sys, os

BASE     = os.path.dirname(os.path.abspath(__file__))
ML_MODEL = os.path.dirname(BASE)
sys.path.append(ML_MODEL)

from utils.preprocessing import preprocess_heart
from utils.preprocessing_diabetes import preprocess_diabetes
from utils.preprocessing_stroke import preprocess_stroke

DISEASE_NAMES = {
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

# ── Load all models ────────────────────────────────────────────────────────────
def load_models():
    def _load_clinical(folder, filename):
        data = joblib.load(os.path.join(ML_MODEL, folder, filename))
        if isinstance(data, dict):
            return data.get("model"), data.get("scaler")
        return data, None  # old format — no scaler

    heart_model,    heart_scaler    = _load_clinical("heart",    "heart_model.pkl")
    diabetes_model, diabetes_scaler = _load_clinical("diabetes", "diabetes_model.pkl")
    stroke_model,   stroke_scaler   = _load_clinical("stroke",   "stroke_model.pkl")

    ecg_data = joblib.load(os.path.join(ML_MODEL, "ECG", "ECG_model.pkl"))
    eeg_data = joblib.load(os.path.join(ML_MODEL, "EEG", "EEG_model.pkl"))
    emg_data = joblib.load(os.path.join(ML_MODEL, "EMG", "EMG_model.pkl"))
    meta_data = joblib.load(os.path.join(BASE, "meta_model.pkl"))

    return {
        "heart_model":    heart_model,    "heart_scaler":    heart_scaler,
        "diabetes_model": diabetes_model, "diabetes_scaler": diabetes_scaler,
        "stroke_model":   stroke_model,   "stroke_scaler":   stroke_scaler,
        "ecg_model":      ecg_data["model"], "ecg_scaler": ecg_data["scaler"],
        "eeg_model":      eeg_data["model"], "eeg_scaler": eeg_data["scaler"],
        "emg_model":      emg_data["model"], "emg_scaler": emg_data["scaler"],
        "meta_model":     meta_data["model"],
        "label_encoder":  meta_data.get("label_encoder"),
    }


# ── Core prediction ────────────────────────────────────────────────────────────
def predict(patient_input: dict, models: dict, verbose: bool = True) -> dict:
    df = pd.DataFrame([patient_input])

    bp     = patient_input["BP"]
    hr     = patient_input["HeartRate"]
    glucose= patient_input["Glucose"]
    spo2   = patient_input["SpO2"]
    sleep  = patient_input["Sleep"]
    steps  = patient_input["Steps"]

    # ── Step 1: Clinical preprocessing ────────────────────────────────────────
    heart_input    = preprocess_heart(df.copy())
    diabetes_input = preprocess_diabetes(df.copy())
    stroke_input   = preprocess_stroke(df.copy())

    # ── Step 2: Clinical probabilities ────────────────────────────────────────
    # Heart / Diabetes — apply scaler if new format model
    if models["heart_scaler"] is not None:
        heart_input_s = models["heart_scaler"].transform(heart_input)
    else:
        heart_input_s = heart_input

    if models["diabetes_scaler"] is not None:
        diabetes_input_s = models["diabetes_scaler"].transform(diabetes_input)
    else:
        diabetes_input_s = diabetes_input

    # Stroke — always apply scaler (retrained model always has one)
    # Pass as DataFrame to match how scaler was fitted (avoids feature name warning)
    if models["stroke_scaler"] is not None:
        stroke_input_s = pd.DataFrame(
            models["stroke_scaler"].transform(stroke_input),
            columns=stroke_input.columns
        )
    else:
        stroke_input_s = stroke_input

    heart_prob    = float(models["heart_model"].predict_proba(heart_input_s)[0][1])
    diabetes_prob = float(models["diabetes_model"].predict_proba(diabetes_input_s)[0][1])
    stroke_prob   = float(models["stroke_model"].predict_proba(stroke_input_s)[0][1])

    # ── Step 3: Signal features ────────────────────────────────────────────────
    hrv_sdnn     = float(np.clip(100 - hr * 0.5, 5, 80))
    stress_ratio = float(np.clip(bp / hr, 0.5, 5.0))

    # EMG: pipeline computes rms = steps/10000 (model retrained on same logic)
    emg_rms      = float(np.clip(steps / 10000, 0.01, 1.5))

    # ── Step 4: Signal predictions ─────────────────────────────────────────────
    ecg_raw    = np.array([[hr,           hrv_sdnn]])
    eeg_raw    = np.array([[stress_ratio, sleep]])
    emg_raw    = np.array([[emg_rms,      steps]])

    ecg_prob  = float(models["ecg_model"].predict_proba(
                    models["ecg_scaler"].transform(ecg_raw))[0][1])

    eeg_proba = models["eeg_model"].predict_proba(
                    models["eeg_scaler"].transform(eeg_raw))[0]
    eeg_neuro_prob    = float(1 - eeg_proba[0])
    eeg_epilepsy_prob = float(eeg_proba[2])

    emg_prob  = float(models["emg_model"].predict_proba(
                    models["emg_scaler"].transform(emg_raw))[0][1])

    # ── Step 5: Engineered meta features ──────────────────────────────────────
    static_risk = (
        0.25 * heart_prob +
        0.25 * diabetes_prob +
        0.20 * stroke_prob +
        0.15 * ecg_prob +
        0.15 * eeg_neuro_prob
    )
    cardio_combined    = (heart_prob + ecg_prob) / 2
    neuro_combined     = (stroke_prob + eeg_neuro_prob + emg_prob) / 3
    metabolic_combined = (diabetes_prob + static_risk) / 2
    fatigue_index      = (emg_prob + eeg_neuro_prob) / 2
    ncm_index = (
        0.22 * heart_prob +
        0.22 * diabetes_prob +
        0.20 * stroke_prob +
        0.14 * ecg_prob +
        0.12 * eeg_neuro_prob +
        0.10 * static_risk
    ) * 100

    # ── Step 6: Meta model ─────────────────────────────────────────────────────
    meta_input = np.array([[
        heart_prob, diabetes_prob, stroke_prob,
        ecg_prob, eeg_neuro_prob, emg_prob,
        static_risk, ncm_index,
        cardio_combined, neuro_combined,
        metabolic_combined, fatigue_index
    ]])

    meta_proba    = models["meta_model"].predict_proba(meta_input)[0]
    meta_raw_pred = int(models["meta_model"].predict(meta_input)[0])

    le = models.get("label_encoder")
    if le is not None:
        try:
            meta_pred_class = int(le.inverse_transform([meta_raw_pred])[0])
        except Exception:
            meta_pred_class = meta_raw_pred
    else:
        meta_pred_class = meta_raw_pred

    meta_confidence = float(np.max(meta_proba))

    # ── Step 7: Rule engine ────────────────────────────────────────────────────
    final_class = meta_pred_class

    # LEVEL 1 — Life threatening
    # Stroke requires BOTH high probability AND vascular indicators (not just glucose)
    # High glucose alone = diabetes, not stroke
    if stroke_prob > 0.85 and bp > 150 and spo2 < 97:
        final_class = 1                                         # Stroke (low O2 + high BP)

    elif stroke_prob > 0.90 and bp > 165:
        final_class = 1                                         # Stroke (very high BP)

    elif heart_prob > 0.88 and ecg_prob > 0.75:
        final_class = 0                                         # CHD

    # LEVEL 2 — Metabolic
    # Diabetes wins if glucose is the dominant elevated feature
    elif diabetes_prob > 0.85 and glucose > 180 and bp < 160:
        final_class = 2                                         # Diabetes

    elif metabolic_combined > 0.80 and glucose > 140:
        final_class = 5                                         # Metabolic Syndrome

    elif bp > 175 and stroke_prob > 0.60:
        final_class = 3                                         # Hypertension

    # LEVEL 3 — Signal dominant
    elif ecg_prob > 0.92 and stroke_prob < 0.75 and heart_prob < 0.75:
        final_class = 4                                         # Arrhythmia

    elif eeg_epilepsy_prob > 0.85 and emg_prob > 0.65 and stroke_prob < 0.75:
        final_class = 7                                         # Epilepsy

    elif neuro_combined > 0.80 and stroke_prob < 0.75:
        final_class = 6                                         # Neuro Disorder

    # LEVEL 4 — Healthy
    elif (
        static_risk < 0.25 and
        heart_prob < 0.35 and diabetes_prob < 0.35 and stroke_prob < 0.50 and
        ecg_prob < 0.35 and eeg_neuro_prob < 0.35 and emg_prob < 0.35
    ):
        final_class = 8                                         # No Disease

    # LEVEL 5 — Meta fallback
    else:
        final_class = meta_pred_class

    final_disease  = DISEASE_NAMES.get(final_class, "Unknown")
    rule_overrode  = (final_class != meta_pred_class)

    result = {
        "final_disease":   final_disease,
        "final_class":     final_class,
        "meta_confidence": round(meta_confidence, 4),
        "rule_override":   rule_overrode,
        "probabilities": {
            "heart_prob":        round(heart_prob,        4),
            "diabetes_prob":     round(diabetes_prob,     4),
            "stroke_prob":       round(stroke_prob,       4),
            "ecg_prob":          round(ecg_prob,          4),
            "eeg_neuro_prob":    round(eeg_neuro_prob,    4),
            "eeg_epilepsy_prob": round(eeg_epilepsy_prob, 4),
            "emg_prob":          round(emg_prob,          4),
        },
        "meta_features": {
            "static_risk":        round(static_risk,        4),
            "ncm_index":          round(ncm_index,          2),
            "cardio_combined":    round(cardio_combined,    4),
            "neuro_combined":     round(neuro_combined,     4),
            "metabolic_combined": round(metabolic_combined, 4),
            "fatigue_index":      round(fatigue_index,      4),
        }
    }

    if verbose:
        _print_result(patient_input, result, meta_pred_class)

    return result


def _print_result(inp, r, meta_pred_class):
    p  = r["probabilities"]
    mf = r["meta_features"]
    print("\n" + "="*52)
    print("  PATIENT INPUT")
    print("="*52)
    for k, v in inp.items():
        print(f"  {k:12s}: {v}")
    print("\n" + "="*52)
    print("  BASE MODEL OUTPUTS")
    print("="*52)
    print(f"  Heart Prob          : {p['heart_prob']}")
    print(f"  Diabetes Prob       : {p['diabetes_prob']}")
    print(f"  Stroke Prob         : {p['stroke_prob']}")
    print(f"  ECG Prob (arrhy)    : {p['ecg_prob']}")
    print(f"  EEG Neuro Prob      : {p['eeg_neuro_prob']}")
    print(f"  EEG Epilepsy Prob   : {p['eeg_epilepsy_prob']}")
    print(f"  EMG Abnormal Prob   : {p['emg_prob']}")
    print("\n" + "="*52)
    print("  ENGINEERED META FEATURES")
    print("="*52)
    print(f"  Static Risk         : {mf['static_risk']}")
    print(f"  NCM Index           : {mf['ncm_index']}")
    print(f"  Cardio Combined     : {mf['cardio_combined']}")
    print(f"  Neuro Combined      : {mf['neuro_combined']}")
    print(f"  Metabolic Combined  : {mf['metabolic_combined']}")
    print(f"  Fatigue Index       : {mf['fatigue_index']}")
    print("\n" + "="*52)
    print("  FINAL DIAGNOSIS")
    print("="*52)
    print(f"  Meta Model Predicted: {DISEASE_NAMES.get(meta_pred_class,'?')} ({r['meta_confidence']} confidence)")
    if r["rule_override"]:
        print(f"  ⚠️  Rule Engine Override Applied")
    print(f"  ✅ Final Diagnosis  : {r['final_disease']}")
    print("="*52)


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    models = load_models()

    test_patients = [
        {
            "name": "High Glucose + Elevated BP (expect Diabetes/Metabolic)",
            "input": {"BP": 140, "HeartRate": 85, "Glucose": 260, "SpO2": 97, "Sleep": 7, "Steps": 4000}
        },
        {
            "name": "Fast HR + Low HRV (expect Arrhythmia/CHD)",
            "input": {"BP": 130, "HeartRate": 135, "Glucose": 100, "SpO2": 98, "Sleep": 7, "Steps": 5000}
        },
        {
            "name": "Very High BP (expect Hypertension/Stroke)",
            "input": {"BP": 185, "HeartRate": 78, "Glucose": 110, "SpO2": 97, "Sleep": 6, "Steps": 3000}
        },
        {
            "name": "Poor sleep + High stress (expect Neuro/Epilepsy)",
            "input": {"BP": 125, "HeartRate": 70, "Glucose": 95, "SpO2": 99, "Sleep": 3, "Steps": 2000}
        },
        {
            "name": "All normal (expect Healthy)",
            "input": {"BP": 115, "HeartRate": 68, "Glucose": 90, "SpO2": 99, "Sleep": 8, "Steps": 8000}
        },
        {
            "name": "All normal (expect Healthy)",
            "input": {"BP": 120, "HeartRate": 72, "Glucose": 95, "SpO2": 98, "Sleep": 7, "Steps": 8000}
        },
        {
            "name": "Stroke (expect stroke)",
            "input": {"BP": 190, "HeartRate": 95, "Glucose": 110, "SpO2": 92, "Sleep": 5, "Steps": 2000}
        },
        {
            "name": "Diabetes (expect Diabetes)",
            "input": {"BP": 145, "HeartRate": 85, "Glucose": 260, "SpO2": 96, "Sleep": 6, "Steps": 3000}
        },
        {
            "name": "Arrhythmia (expect Arrythmia)",
            "input": {"BP": 130, "HeartRate": 135, "Glucose": 100, "SpO2": 97, "Sleep": 6, "Steps": 4000}
        },
        {
            "name": "Epilepsy (expect Epilepsy)",
            "input": {"BP": 160, "HeartRate": 90, "Glucose": 105, "SpO2": 95, "Sleep": 3, "Steps": 1500}
        },
        {
            "name": "Hypertension (expect Hypertension)",
            "input": {"BP": 180, "HeartRate": 75, "Glucose": 100, "SpO2": 97, "Sleep": 7, "Steps": 6000}
        },
    ]

    for patient in test_patients:
        print(f"\n{'#'*52}")
        print(f"  CASE: {patient['name']}")
        print(f"{'#'*52}")
        predict(patient["input"], models, verbose=True)