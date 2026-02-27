"""
EEG Realistic Dataset Generator
- 45% Normal | 35% Mild Neuro | 20% Epilepsy
- Features: stress_ratio, sleep_hours
- Overlapping distributions with noise
"""
import numpy as np
import pandas as pd

np.random.seed(42)
n = 5000

n_normal = int(n * 0.45)   # label=0
n_mild   = int(n * 0.35)   # label=1
n_epil   = n - n_normal - n_mild  # label=2

# --- NORMAL ---
normal_stress = np.random.normal(1.2, 0.3, n_normal)   # Low stress ratio
normal_sleep  = np.random.normal(7.5, 0.8, n_normal)   # Healthy sleep

# --- MILD NEURO ---
mild_stress = np.random.normal(1.8, 0.4, n_mild)       # Elevated stress
mild_sleep  = np.random.normal(5.5, 1.0, n_mild)       # Disrupted sleep

# --- EPILEPSY ---
epil_stress = np.random.normal(2.5, 0.5, n_epil)       # High stress ratio
epil_sleep  = np.random.normal(4.0, 1.2, n_epil)       # Poor sleep

# Combine
stress_ratio = np.concatenate([normal_stress, mild_stress, epil_stress])
sleep_hours  = np.concatenate([normal_sleep,  mild_sleep,  epil_sleep])
labels       = np.array([0]*n_normal + [1]*n_mild + [2]*n_epil)

# Overlap noise
stress_ratio += np.random.normal(0, 0.15, n)
sleep_hours  += np.random.normal(0, 0.3,  n)

# Clip to realistic bounds
sleep_hours = np.clip(sleep_hours, 1.0, 12.0)
stress_ratio = np.clip(stress_ratio, 0.5, 5.0)

df = pd.DataFrame({
    "stress_ratio": stress_ratio,
    "sleep_hours":  sleep_hours,
    "Label":        labels
})

df.to_csv("EEG_dataset_realistic.csv", index=False)
print(f"✅ EEG dataset saved: {len(df)} rows | Normal: {n_normal} | Mild: {n_mild} | Epilepsy: {n_epil}")
print(df.groupby("Label")[["stress_ratio", "sleep_hours"]].mean().round(2))