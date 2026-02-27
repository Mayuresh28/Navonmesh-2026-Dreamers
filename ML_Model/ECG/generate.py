"""
ECG Realistic Dataset Generator
- 40% Normal | 60% Arrhythmia
- Overlapping distributions with noise
- Features: HeartRate, HRV_SDNN
"""
import numpy as np
import pandas as pd

np.random.seed(42)
n = 5000

# --- NORMAL ECG (label=0) ---
n_normal = int(n * 0.4)
normal_hr  = np.random.normal(72, 10, n_normal)   # Healthy resting HR
normal_hrv = np.random.normal(60, 15, n_normal)    # Good HRV

# --- ARRHYTHMIA (label=1) ---
n_arr = int(n * 0.6)
arr_hr  = np.random.normal(110, 25, n_arr)         # Elevated / irregular HR
arr_hrv = np.random.normal(30,  20, n_arr)         # Low HRV

# Combine
heart_rate = np.concatenate([normal_hr, arr_hr])
hrv_sdnn   = np.concatenate([normal_hrv, arr_hrv])
labels     = np.array([0] * n_normal + [1] * n_arr)

# Add realistic overlap noise
heart_rate += np.random.normal(0, 5, n)
hrv_sdnn   += np.random.normal(0, 5, n)

df = pd.DataFrame({
    "HeartRate": heart_rate,
    "HRV_SDNN":  hrv_sdnn,
    "Label":     labels
})

df.to_csv("ECG_dataset_realistic.csv", index=False)
print(f"✅ ECG dataset saved: {len(df)} rows | Normal: {n_normal} | Arrhythmia: {n_arr}")
print(df.groupby("Label")[["HeartRate", "HRV_SDNN"]].mean().round(2))