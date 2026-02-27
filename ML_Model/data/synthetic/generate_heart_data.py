import numpy as np
import pandas as pd

np.random.seed(42)

n = 10000

# Generate physiological ranges
bp = np.random.normal(130, 20, n)
heart_rate = np.random.normal(80, 15, n)
glucose = np.random.normal(110, 30, n)
spo2 = np.random.normal(96, 2, n)
sleep = np.random.normal(6.5, 1.5, n)
steps = np.random.normal(6000, 2500, n)

# Clip values
bp = np.clip(bp, 90, 200)
heart_rate = np.clip(heart_rate, 50, 150)
glucose = np.clip(glucose, 70, 250)
spo2 = np.clip(spo2, 85, 100)
sleep = np.clip(sleep, 3, 10)
steps = np.clip(steps, 0, 20000)

# Softer risk score (reduced weights)
score = (
    0.02 * (bp - 130) +
    0.015 * (heart_rate - 80) +
    0.0015 * (glucose - 110) -
    0.03 * (sleep - 6.5) -
    0.00015 * (steps - 6000) -
    0.15 * (spo2 - 96)
)

# Add random noise (very important for realism)
noise = np.random.normal(0, 0.5, n)
score = score + noise

# Convert to probability
probability = 1 / (1 + np.exp(-score))

# Threshold tuned for 30–35% positives
heart_risk = (probability > 0.65).astype(int)

df = pd.DataFrame({
    "BP": bp,
    "HeartRate": heart_rate,
    "Glucose": glucose,
    "SpO2": spo2,
    "Sleep": sleep,
    "Steps": steps,
    "HeartDisease": heart_risk
})

df.to_csv("heart_synthetic_10k.csv", index=False)
print("Heart dataset generated!")