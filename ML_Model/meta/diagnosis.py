"""
diagnosis.py — Run this in ML_Model/meta/ to find root causes
of over-triggering stroke and broken EMG.
"""
import joblib
import numpy as np
import pandas as pd
import os, sys

BASE     = os.path.dirname(os.path.abspath(__file__))
ML_MODEL = os.path.dirname(BASE)
sys.path.append(ML_MODEL)

from utils.preprocessing import preprocess_heart
from utils.preprocessing_diabetes import preprocess_diabetes
from utils.preprocessing_stroke import preprocess_stroke

# ── Load models ───────────────────────────────────────────────────────────────
stroke_data = joblib.load(os.path.join(ML_MODEL, "stroke", "stroke_model.pkl"))
stroke_model = stroke_data["model"] if isinstance(stroke_data, dict) else stroke_data

emg_data   = joblib.load(os.path.join(ML_MODEL, "EMG", "EMG_model.pkl"))
emg_model  = emg_data["model"]
emg_scaler = emg_data["scaler"]

print("=" * 60)
print("DIAGNOSIS 1 — What features does stroke model expect?")
print("=" * 60)
# Check what preprocess_stroke produces
test_input = pd.DataFrame([{
    "BP": 115, "HeartRate": 68, "Glucose": 90,
    "SpO2": 99, "Sleep": 8, "Steps": 8000
}])
stroke_processed = preprocess_stroke(test_input.copy())
print(f"Stroke input columns : {list(stroke_processed.columns)}")
print(f"Stroke input values  : {stroke_processed.values[0]}")
print(f"Stroke prob (healthy patient): {stroke_model.predict_proba(stroke_processed)[0][1]:.4f}")
print()

# Sweep BP to see if stroke responds
print("Stroke prob sweep (varying BP, HR=70, all else normal):")
for bp in [110, 120, 130, 140, 150, 160, 170, 180]:
    row = pd.DataFrame([{"BP": bp, "HeartRate": 70, "Glucose": 90, "SpO2": 99, "Sleep": 8, "Steps": 6000}])
    p = stroke_model.predict_proba(preprocess_stroke(row))[0][1]
    bar = "█" * int(p * 30)
    print(f"  BP={bp}: {p:.4f}  {bar}")

print()
print("Stroke prob sweep (varying Glucose, BP=120):")
for g in [80, 100, 120, 140, 160, 200, 250, 300]:
    row = pd.DataFrame([{"BP": 120, "HeartRate": 70, "Glucose": g, "SpO2": 99, "Sleep": 8, "Steps": 6000}])
    p = stroke_model.predict_proba(preprocess_stroke(row))[0][1]
    bar = "█" * int(p * 30)
    print(f"  Glucose={g}: {p:.4f}  {bar}")

print()
print("=" * 60)
print("DIAGNOSIS 2 — EMG model behaviour")
print("=" * 60)
print("EMG scaler mean_  :", emg_scaler.mean_)
print("EMG scaler scale_ :", emg_scaler.scale_)
print()
print("EMG prob sweep (varying steps, rms=0.45):")
for steps in [500, 1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000]:
    rms = 0.45
    raw = np.array([[rms, steps]])
    scaled = emg_scaler.transform(raw)
    p = emg_model.predict_proba(scaled)[0][1]
    bar = "█" * int(p * 30)
    print(f"  steps={steps:6d}: abnormal={p:.4f}  {bar}")

print()
print("EMG prob sweep (varying emg_rms from pipeline, steps=8000):")
for steps in [500, 2000, 4000, 6000, 8000, 10000]:
    # This is how predict_pipeline.py computes emg_rms
    emg_rms = np.clip(steps / 10000, 0.05, 1.5)
    raw = np.array([[emg_rms, steps]])
    scaled = emg_scaler.transform(raw)
    p = emg_model.predict_proba(scaled)[0][1]
    bar = "█" * int(p * 30)
    print(f"  steps={steps:6d} → emg_rms={emg_rms:.3f}: abnormal={p:.4f}  {bar}")

print()
print("=" * 60)
print("DIAGNOSIS 3 — Stroke model feature names (if accessible)")
print("=" * 60)
try:
    if hasattr(stroke_model, "feature_names_in_"):
        print("Feature names:", stroke_model.feature_names_in_)
    elif hasattr(stroke_model, "estimators_"):
        base = stroke_model.estimators_[0]
        if hasattr(base, "feature_names_in_"):
            print("Feature names (from base):", base.feature_names_in_)
    else:
        print("Model type:", type(stroke_model))
        print("(No feature_names_in_ attribute — check preprocessing output above)")
except Exception as e:
    print("Could not extract feature names:", e)