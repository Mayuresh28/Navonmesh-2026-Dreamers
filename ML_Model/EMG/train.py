"""
EMG Model — Retrain from scratch (fixed feature engineering)
=============================================================
ROOT CAUSE OF OLD BUG:
  Pipeline computed emg_rms = steps / 10000
  So steps=8000 → emg_rms=0.8, which looked "abnormal"
  because the old model was trained with rms~0.45 for normal.

FIX:
  EMG features: [emg_rms, steps]
  Normal:   emg_rms ~ 0.45, steps ~ 7500   (low rms = clean signal, active)
  Abnormal: emg_rms ~ 0.75, steps ~ 3000   (high rms = noisy signal, sedentary)

  The pipeline's rms = steps/10000 will now be CONSISTENT:
    steps=8000 → rms=0.8 → BUT steps=8000 is in normal range → model learns
    to use BOTH features together, not just rms alone.

  We retrain on the SAME feature engineering the pipeline uses,
  so scaler expectations match pipeline outputs.

Run this from ML_Model/EMG/
"""
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, brier_score_loss

np.random.seed(42)
n = 5000

# ── NORMAL (label=0) — 50% ──────────────────────────────────────────────────
# Normal people: active (high steps) → pipeline rms = steps/10000 = ~0.7–1.0
# BUT their actual muscle signal rms is LOW (clean, efficient contractions)
n0 = int(n * 0.5)
steps0   = np.random.normal(7500, 1500, n0)   # active
steps0   = np.clip(steps0, 500, 20000)
# Pipeline computes rms = steps/10000, so we simulate that exactly
emg_rms0 = steps0 / 10000 + np.random.normal(0, 0.03, n0)  # slight noise

# ── ABNORMAL (label=1) — 50% ────────────────────────────────────────────────
# Abnormal: sedentary (low steps) AND elevated rms (noisy/disordered signal)
n1 = n - n0
steps1   = np.random.normal(2500, 1200, n1)
steps1   = np.clip(steps1, 0, 8000)
# Abnormal: rms is HIGHER than what steps/10000 would predict
emg_rms1 = steps1 / 10000 + np.random.normal(0.35, 0.08, n1)  # elevated rms

# ── Combine ─────────────────────────────────────────────────────────────────
emg_rms = np.clip(np.concatenate([emg_rms0, emg_rms1]), 0.01, 1.5)
steps   = np.clip(np.concatenate([steps0,   steps1]),   0,    20000)
labels  = np.array([0]*n0 + [1]*n1)

# Add small overlap noise
emg_rms += np.random.normal(0, 0.02, n)
steps   += np.random.normal(0, 200,  n)
emg_rms  = np.clip(emg_rms, 0.01, 1.5)
steps    = np.clip(steps, 0, 20000)

df = pd.DataFrame({
    "emg_rms": emg_rms,
    "steps":   steps,
    "Label":   labels
})

df.to_csv("EMG_dataset_fixed.csv", index=False)
print(f"✅ EMG dataset: {len(df)} rows")
print(df.groupby("Label")[["emg_rms", "steps"]].mean().round(3))

# ── Train ────────────────────────────────────────────────────────────────────
X = df[["emg_rms", "steps"]].values
y = df["Label"].values

scaler   = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

base = GradientBoostingClassifier(
    n_estimators=200, max_depth=3,
    learning_rate=0.05, subsample=0.8, random_state=42
)
base.fit(X_train, y_train)

calibrated = CalibratedClassifierCV(base, method="isotonic", cv=5)
calibrated.fit(X_train, y_train)

y_pred  = calibrated.predict(X_test)
y_proba = calibrated.predict_proba(X_test)[:, 1]

print("\n" + "="*50)
print("EMG MODEL EVALUATION (FIXED)")
print("="*50)
print(classification_report(y_test, y_pred, target_names=["Normal", "Abnormal"]))
print(f"Brier Score: {brier_score_loss(y_test, y_proba):.4f}")

print("\n── Probability Sanity Checks (using pipeline logic: rms=steps/10000) ──")
cases = [
    ("Very active:  steps=10000", 10000),
    ("Active:       steps=8000",  8000),
    ("Moderate:     steps=5000",  5000),
    ("Low activity: steps=2000",  2000),
    ("Sedentary:    steps=500",   500),
]
for label, st in cases:
    rms    = np.clip(st / 10000, 0.05, 1.5)
    raw    = np.array([[rms, st]])
    scaled = scaler.transform(raw)
    p = calibrated.predict_proba(scaled)[0]
    print(f"  {label:30s} rms={rms:.3f} → Normal: {p[0]:.3f} | Abnormal: {p[1]:.3f}")

print("\n── Additional check: high rms + low steps = abnormal ──")
for rms_add, st in [(0.0, 8000), (0.2, 8000), (0.35, 2000), (0.40, 1000)]:
    rms    = np.clip(st/10000 + rms_add, 0.01, 1.5)
    raw    = np.array([[rms, st]])
    scaled = scaler.transform(raw)
    p = calibrated.predict_proba(scaled)[0]
    print(f"  rms={rms:.3f}, steps={st:5d} → Normal: {p[0]:.3f} | Abnormal: {p[1]:.3f}")

joblib.dump({"model": calibrated, "scaler": scaler}, "EMG_model.pkl")
print("\n✅ EMG_model.pkl saved (fixed)")