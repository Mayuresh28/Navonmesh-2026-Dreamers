"""
EMG Realistic Dataset Generator
- 50% Normal | 50% Abnormal (muscle disorder)
- Features: emg_rms, steps
- Overlapping distributions with noise
"""
import numpy as np
import pandas as pd

np.random.seed(42)
n = 5000

n_normal = int(n * 0.5)   # label=0
n_abnorm = n - n_normal   # label=1

# --- NORMAL ---
normal_rms   = np.random.normal(0.45, 0.10, n_normal)  # Healthy muscle signal
normal_steps = np.random.normal(7500, 1500, n_normal)  # Active steps/day

# --- ABNORMAL (myopathy / neuropathy) ---
abnorm_rms   = np.random.normal(0.75, 0.15, n_abnorm)  # Elevated or irregular RMS
abnorm_steps = np.random.normal(3500, 1800, n_abnorm)  # Reduced activity

# Combine
emg_rms = np.concatenate([normal_rms,   abnorm_rms])
steps   = np.concatenate([normal_steps, abnorm_steps])
labels  = np.array([0]*n_normal + [1]*n_abnorm)

# Overlap noise
emg_rms += np.random.normal(0, 0.04, n)
steps   += np.random.normal(0, 300,  n)

# Clip to realistic bounds
emg_rms = np.clip(emg_rms, 0.05, 1.5)
steps   = np.clip(steps, 0, 25000)

df = pd.DataFrame({
    "emg_rms": emg_rms,
    "steps":   steps,
    "Label":   labels
})

df.to_csv("EMG_dataset_realistic.csv", index=False)
print(f"✅ EMG dataset saved: {len(df)} rows | Normal: {n_normal} | Abnormal: {n_abnorm}")
print(df.groupby("Label")[["emg_rms", "steps"]].mean().round(2))