import numpy as np
import pandas as pd

np.random.seed(42)

n = 10000

# Physiological ranges
bp = np.random.normal(130, 20, n)
heart_rate = np.random.normal(80, 15, n)
glucose = np.random.normal(110, 35, n)   # Wider variation for diabetes
spo2 = np.random.normal(96, 2, n)
sleep = np.random.normal(6.5, 1.5, n)
steps = np.random.normal(6000, 2500, n)

# Clip realistic limits
bp = np.clip(bp, 90, 200)
heart_rate = np.clip(heart_rate, 50, 150)
glucose = np.clip(glucose, 70, 300)
spo2 = np.clip(spo2, 85, 100)
sleep = np.clip(sleep, 3, 10)
steps = np.clip(steps, 0, 20000)

# Diabetes risk score (glucose dominant)
score = (
    0.04 * (glucose - 110) +
    0.015 * (bp - 130) -
    0.0002 * (steps - 6000) -
    0.03 * (sleep - 6.5)
)

# Add noise
noise = np.random.normal(0, 0.6, n)
score += noise

# Convert to probability
probability = 1 / (1 + np.exp(-score))

# Threshold tuned for ~25–35% positives
diabetes_risk = (probability > 0.65).astype(int)

df = pd.DataFrame({
    "BP": bp,
    "HeartRate": heart_rate,
    "Glucose": glucose,
    "SpO2": spo2,
    "Sleep": sleep,
    "Steps": steps,
    "Diabetes": diabetes_risk
})

df.to_csv("diabetes_synthetic_10k.csv", index=False)
print("Diabetes dataset generated!")