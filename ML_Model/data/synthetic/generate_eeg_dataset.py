import numpy as np
import pandas as pd
import os

np.random.seed(42)

n = 10000

# ==========================================
# EEG Derived Feature
# ==========================================

stress_ratio = np.random.normal(1.2, 0.4, n)
sleep_hours = np.random.normal(6.5, 1.5, n)

stress_ratio = np.clip(stress_ratio, 0.5, 3.0)
sleep_hours = np.clip(sleep_hours, 3, 10)

# ==========================================
# Softer Neurological Risk Logic
# ==========================================

score = (
    0.8 * (stress_ratio - 1.2) -
    0.4 * (sleep_hours - 6.5)
)

noise = np.random.normal(0, 0.5, n)
score = score + noise

probability = 1 / (1 + np.exp(-score))

eeg_abnormal = (probability > 0.65).astype(int)

df = pd.DataFrame({
    "stress_ratio": stress_ratio,
    "sleep_hours": sleep_hours,
    "EEG_Abnormal": eeg_abnormal
})

os.makedirs("../data", exist_ok=True)
df.to_csv("../data/eeg_synthetic_10k.csv", index=False)

print("EEG dataset generated!")