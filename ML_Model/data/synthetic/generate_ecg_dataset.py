import numpy as np
import pandas as pd
import os

np.random.seed(42)

n = 10000

# ==========================================
# Physiological Signal Features
# ==========================================

heart_rate = np.random.normal(80, 15, n)
hrv_sdnn = np.random.normal(50, 15, n)

heart_rate = np.clip(heart_rate, 50, 150)
hrv_sdnn = np.clip(hrv_sdnn, 10, 120)

# ==========================================
# Softer ECG Risk Logic
# ==========================================

score = (
    0.025 * (heart_rate - 80) -
    0.03 * (hrv_sdnn - 50)
)

# Add noise for realism
noise = np.random.normal(0, 0.5, n)
score = score + noise

probability = 1 / (1 + np.exp(-score))

# ~30% abnormal ECG
ecg_abnormal = (probability > 0.65).astype(int)

df = pd.DataFrame({
    "heart_rate": heart_rate,
    "hrv_sdnn": hrv_sdnn,
    "ECG_Abnormal": ecg_abnormal
})

os.makedirs("../data/data", exist_ok=True)
df.to_csv("../data/data/ecg_synthetic_10k.csv", index=False)

print("✅ ECG dataset generated! (10000 rows)")