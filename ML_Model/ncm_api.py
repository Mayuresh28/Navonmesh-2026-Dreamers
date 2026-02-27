"""
NCM Prediction API
==================
A lightweight FastAPI server that loads the trained ECG/EEG/EMG models
and exposes a /predict endpoint for the Next.js frontend.

Run:  python ncm_api.py
"""

import os
import sys
import numpy as np
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Load Models on Startup ───────────────────────────────────────────────────
try:
    ecg_model  = joblib.load(os.path.join(SCRIPT_DIR, "ECG_model.pkl"))
    eeg_model  = joblib.load(os.path.join(SCRIPT_DIR, "EEG_model.pkl"))
    emg_model  = joblib.load(os.path.join(SCRIPT_DIR, "EMG_model.pkl"))
    ecg_scaler = joblib.load(os.path.join(SCRIPT_DIR, "ECG_scaler.pkl"))
    eeg_scaler = joblib.load(os.path.join(SCRIPT_DIR, "EEG_scaler.pkl"))
    emg_scaler = joblib.load(os.path.join(SCRIPT_DIR, "EMG_scaler.pkl"))
    print("✓ All models loaded successfully")
except Exception as e:
    print(f"✗ Failed to load models: {e}")
    sys.exit(1)

# ─── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(title="NCM Health Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Schemas ────────────────────────────────────────────────
class NCMInput(BaseModel):
    heart_rate: float     # bpm (mean from ECG readings)
    hrv_sdnn: float       # ms  (SDNN from R-R intervals)
    stress_ratio: float   # beta/alpha power ratio from EEG
    emg_rms: float        # RMS amplitude from EMG


class NCMResult(BaseModel):
    # Probabilities (0-1)
    cardiac_prob: float
    stress_prob: float
    fatigue_prob: float

    # Labels
    cardiac_state: str
    stress_state: str
    muscle_state: str
    systemic_flag: str

    # Composite NCM Index (0-100)
    ncm_index: float

    # Risk category
    risk_category: str

    # Computed features (so the frontend can display them)
    heart_rate: float = 72.0
    hrv_sdnn: float = 50.0
    stress_ratio: float = 1.0
    emg_rms: float = 0.3


# ─── Feature computation helpers ───────────────────────────────────────────────

def compute_hrv_sdnn(rr_intervals: list[float]) -> float:
    """Compute SDNN from a list of R-R intervals (ms)."""
    if len(rr_intervals) < 2:
        return 50.0  # fallback
    return float(np.std(rr_intervals, ddof=1))


def compute_stress_ratio(eeg_values: list[float], fs: int = 128) -> float:
    """Compute beta/alpha power ratio from raw EEG values."""
    if len(eeg_values) < 10:
        return 1.0  # fallback
    from scipy.signal import welch
    freqs, psd = welch(np.array(eeg_values), fs)
    alpha_idx = np.logical_and(freqs >= 8, freqs <= 13)
    beta_idx  = np.logical_and(freqs >= 13, freqs <= 30)
    alpha_power = np.trapz(psd[alpha_idx], freqs[alpha_idx]) if alpha_idx.any() else 0.001
    beta_power  = np.trapz(psd[beta_idx],  freqs[beta_idx])  if beta_idx.any()  else 0
    return float(beta_power / alpha_power) if alpha_power > 0.001 else 0.0


def compute_emg_rms(emg_values: list[float]) -> float:
    """Compute RMS from raw EMG values, scaled to model range (0.15-1.2)."""
    if len(emg_values) < 2:
        return 0.2  # fallback
    rms = float(np.sqrt(np.mean(np.array(emg_values) ** 2)))
    # Sample EMG data is in mV range (17-31), model expects ~0.15-1.2
    # Scale down if raw values are large
    if rms > 5.0:
        rms = rms / 25.0
    return np.clip(rms, 0.05, 2.0)


# ─── Predict from raw arrays ──────────────────────────────────────────────────

class RawInput(BaseModel):
    ecg: list[float] = []       # raw ECG readings (heart rate values or R-R)
    eeg: list[float] = []       # raw EEG readings
    emg: list[float] = []       # raw EMG readings
    heart_rate: list[float] = []  # heart rate bpm values


@app.post("/predict", response_model=NCMResult)
def predict_ncm(inp: NCMInput):
    """Predict from pre-computed features."""
    hr  = np.clip(inp.heart_rate, 40, 200)
    hrv = np.clip(inp.hrv_sdnn, 5, 300)
    sr  = np.clip(inp.stress_ratio, 0.01, 60)
    emg = np.clip(inp.emg_rms, 0.05, 2.0)

    ecg_input = ecg_scaler.transform([[hr, hrv]])
    eeg_input = eeg_scaler.transform([[sr]])
    emg_input = emg_scaler.transform([[emg]])

    ecg_prob = float(ecg_model.predict_proba(ecg_input)[0][1])
    eeg_prob = float(eeg_model.predict_proba(eeg_input)[0][1])
    emg_prob = float(emg_model.predict_proba(emg_input)[0][1])

    ncm_index = (0.4 * ecg_prob + 0.35 * eeg_prob + 0.25 * emg_prob) * 100

    cardiac_state = "High Cardiac Risk" if ecg_prob > 0.5 else "Normal Cardiac"
    stress_state  = "High Stress" if eeg_prob > 0.5 else "Relaxed"
    muscle_state  = "Muscle Fatigue" if emg_prob > 0.5 else "Normal Muscle"

    systemic_flag = "Stable"
    if ecg_prob > 0.6 and eeg_prob > 0.6:
        systemic_flag = "Autonomic Overload Risk"
    if eeg_prob > 0.7 and emg_prob > 0.7:
        systemic_flag = "Chronic Stress + Fatigue Risk"

    risk_category = (
        "Low" if ncm_index < 25 else
        "Moderate" if ncm_index < 50 else
        "High" if ncm_index < 75 else
        "Critical"
    )

    return NCMResult(
        cardiac_prob=round(ecg_prob, 4),
        stress_prob=round(eeg_prob, 4),
        fatigue_prob=round(emg_prob, 4),
        cardiac_state=cardiac_state,
        stress_state=stress_state,
        muscle_state=muscle_state,
        systemic_flag=systemic_flag,
        ncm_index=round(ncm_index, 2),
        risk_category=risk_category,
        heart_rate=round(float(hr), 2),
        hrv_sdnn=round(float(hrv), 2),
        stress_ratio=round(float(sr), 4),
        emg_rms=round(float(emg), 4),
    )


@app.post("/predict-raw", response_model=NCMResult)
def predict_from_raw(inp: RawInput):
    """
    Predict from raw sensor arrays (as stored in MongoDB).
    Computes features automatically:
      - heart_rate → mean HR
      - ecg → HRV SDNN (from R-R intervals)
      - eeg → stress_ratio (beta/alpha)
      - emg → RMS amplitude
    """
    # Heart rate: use heart_rate array or ecg array as bpm values
    hr_values = inp.heart_rate if inp.heart_rate else inp.ecg
    mean_hr = float(np.mean(hr_values)) if hr_values else 75.0

    # HRV: compute from ecg values interpreted as R-R intervals (or estimate from HR)
    if inp.ecg and len(inp.ecg) > 2:
        # If ecg values look like bpm readings (60-200), convert to RR intervals
        ecg_arr = np.array(inp.ecg)
        if np.mean(ecg_arr) > 30:  # looks like bpm
            rr_intervals = 60000.0 / ecg_arr  # convert bpm → RR in ms
        else:
            rr_intervals = ecg_arr
        hrv_sdnn = compute_hrv_sdnn(rr_intervals.tolist())
    else:
        hrv_sdnn = 50.0

    # Stress ratio from EEG
    if inp.eeg and len(inp.eeg) > 10:
        stress_ratio = compute_stress_ratio(inp.eeg)
    else:
        stress_ratio = 1.0

    # EMG RMS
    if inp.emg and len(inp.emg) > 2:
        emg_rms = compute_emg_rms(inp.emg)
    else:
        emg_rms = 0.2

    return predict_ncm(NCMInput(
        heart_rate=mean_hr,
        hrv_sdnn=hrv_sdnn,
        stress_ratio=stress_ratio,
        emg_rms=emg_rms,
    ))


@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": True}


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
