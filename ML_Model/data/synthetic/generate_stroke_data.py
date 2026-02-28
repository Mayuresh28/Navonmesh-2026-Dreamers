import numpy as np
import pandas as pd

np.random.seed(42)

n = 10000

# Generate physiological ranges
bp = np.random.normal(135, 25, n)   # Stroke more BP sensitive
heart_rate = np.random.normal(82, 15, n)
glucose = np.random.normal(115, 35, n)
spo2 = np.random.normal(95, 2.5, n)
sleep = np.random.normal(6.5, 1.5, n)
steps = np.random.normal(5500, 2700, n)

# Clip realistic ranges
bp = np.clip(bp, 90, 220)
heart_rate = np.clip(heart_rate, 50, 150)
glucose = np.clip(glucose, 70, 300)
spo2 = np.clip(spo2, 85, 100)
sleep = np.clip(sleep, 3, 10)
steps = np.clip(steps, 0, 20000)

# Stroke risk score (BP dominant + oxygen factor)
score = (
    0.035 * (bp - 130) +
    0.02 * (glucose - 110) -
    0.25 * (spo2 - 96) -
    0.00025 * (steps - 5500) +
    0.015 * (heart_rate - 80)
)

# Add noise
noise = np.random.normal(0, 0.6, n)
score += noise

# Convert to probability
probability = 1 / (1 + np.exp(-score))

# Threshold tuned for 25–35% positives
stroke_risk = (probability > 0.65).astype(int)

df = pd.DataFrame({
    "BP": bp,
    "HeartRate": heart_rate,
    "Glucose": glucose,
    "SpO2": spo2,
    "Sleep": sleep,
    "Steps": steps,
    "Stroke": stroke_risk
})

import os
os.makedirs(".", exist_ok=True)
df.to_csv("./stroke_synthetic_10k.csv", index=False)
print("✅ Stroke dataset generated! (10000 rows)")