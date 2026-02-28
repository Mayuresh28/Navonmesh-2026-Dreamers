"""
Stroke Model — Retrain v2 (realistic overlap, no perfect separation)
=====================================================================
Problem with v1:
  - 100% accuracy, Brier=0.0005 → classes were perfectly separated
  - Model returns 1.0 for almost everyone with any elevated feature
  - No overlap between normal and stroke-risk distributions

Fix:
  - Much more overlap between classes
  - Moderate cases in the middle
  - Scaler fit on DataFrame (not numpy) to fix the feature names warning
  - Softer class boundaries

Run from ML_Model/stroke/
"""
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, brier_score_loss

np.random.seed(42)
n = 6000

FEATURE_COLS = [
    "BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps",
    "PulsePressure", "ActivityScore", "OxygenDeficit", "StrokeRiskIndex"
]

def make_features(bp, hr, glucose, spo2, sleep, steps):
    pp   = bp - (hr * 0.5)
    act  = steps / 10000
    odef = 100 - spo2
    sri  = (bp / 120) * (glucose / 100) * (1 / (spo2 / 100)) * 0.3
    return pp, act, odef, sri

# ── NORMAL (label=0) — 55% ──────────────────────────────────────────────────
n0 = int(n * 0.55)
bp0      = np.random.normal(118, 12, n0)    # wider std = more overlap
hr0      = np.random.normal(70,  10, n0)
glucose0 = np.random.normal(95,  15, n0)
spo2_0   = np.random.normal(98,  1.5,n0)
sleep0   = np.random.normal(7.5, 1.0,n0)
steps0   = np.random.normal(7000,2000,n0)

# ── STROKE RISK (label=1) — 45% ─────────────────────────────────────────────
n1 = n - n0
bp1      = np.random.normal(152, 18, n1)    # overlaps with normal at 130-140
hr1      = np.random.normal(85,  14, n1)
glucose1 = np.random.normal(160, 50, n1)    # wide spread — overlaps
spo2_1   = np.random.normal(95.5,2.5,n1)
sleep1   = np.random.normal(5.5, 1.5,n1)
steps1   = np.random.normal(3000,1500,n1)

# ── Combine + clip ───────────────────────────────────────────────────────────
BP      = np.clip(np.concatenate([bp0,      bp1]),      80,  220)
HR      = np.clip(np.concatenate([hr0,      hr1]),      40,  180)
Glucose = np.clip(np.concatenate([glucose0, glucose1]), 50,  400)
SpO2    = np.clip(np.concatenate([spo2_0,   spo2_1]),   80,  100)
Sleep   = np.clip(np.concatenate([sleep0,   sleep1]),   1,   12)
Steps   = np.clip(np.concatenate([steps0,   steps1]),   0,   20000)
labels  = np.array([0]*n0 + [1]*n1)

# ── Add overlap noise ────────────────────────────────────────────────────────
BP      += np.random.normal(0, 4, n)
Glucose += np.random.normal(0, 10, n)
SpO2    += np.random.normal(0, 0.5, n)
BP      = np.clip(BP,      80,  220)
Glucose = np.clip(Glucose, 50,  400)
SpO2    = np.clip(SpO2,    80,  100)

# ── Engineered features ──────────────────────────────────────────────────────
PP, Act, ODef, SRI = make_features(BP, HR, Glucose, SpO2, Sleep, Steps)

# ── Build DataFrame (scaler fit on DataFrame → no feature name warning) ──────
df = pd.DataFrame({
    "BP": BP, "HeartRate": HR, "Glucose": Glucose,
    "SpO2": SpO2, "Sleep": Sleep, "Steps": Steps,
    "PulsePressure": PP, "ActivityScore": Act,
    "OxygenDeficit": ODef, "StrokeRiskIndex": SRI,
    "Label": labels
})

df.to_csv("stroke_dataset_realistic.csv", index=False)
print(f"✅ Stroke dataset: {len(df)} rows | Normal: {n0} | Stroke risk: {n1}")
print(df.groupby("Label")[["BP","Glucose","SpO2","Steps"]].mean().round(1))

# ── Train ────────────────────────────────────────────────────────────────────
X = df[FEATURE_COLS]   # keep as DataFrame so scaler stores feature names
y = df["Label"].values

# Fit scaler on DataFrame → eliminates the feature name warning
scaler   = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_scaled_df = pd.DataFrame(X_scaled, columns=FEATURE_COLS)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled_df, y, test_size=0.2, random_state=42, stratify=y
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
print("STROKE MODEL EVALUATION")
print("="*50)
print(classification_report(y_test, y_pred, target_names=["Normal", "Stroke Risk"]))
print(f"Brier Score: {brier_score_loss(y_test, y_proba):.4f}")
print("(Good range: 0.05–0.15 | 0.0005 = overfit, no overlap)")

# ── Sanity checks ────────────────────────────────────────────────────────────
print("\n── Probability Sanity Checks ──")
cases = [
    ("Healthy:   BP=112, Glu=88,  SpO2=99, Steps=8000, HR=68, Sleep=8", [112, 68, 88,  99,  8.0, 8000]),
    ("Borderline:BP=138, Glu=130, SpO2=97, Steps=4500, HR=80, Sleep=6", [138, 80, 130, 97,  6.0, 4500]),
    ("High risk: BP=165, Glu=210, SpO2=94, Steps=1500, HR=92, Sleep=5", [165, 92, 210, 94,  5.0, 1500]),
    ("Fast HR:   BP=130, Glu=100, SpO2=98, Steps=5000, HR=135,Sleep=7", [130,135, 100, 98,  7.0, 5000]),
    ("Very high: BP=185, Glu=110, SpO2=97, Steps=3000, HR=78, Sleep=6", [185, 78, 110, 97,  6.0, 3000]),
]
for label, vals in cases:
    bp_, hr_, gl_, sp_, sl_, st_ = vals
    pp_, act_, od_, sri_ = make_features(bp_, hr_, gl_, sp_, sl_, st_)
    row = pd.DataFrame([[bp_, hr_, gl_, sp_, sl_, st_, pp_, act_, od_, sri_]],
                       columns=FEATURE_COLS)
    scaled = scaler.transform(row)
    scaled_df = pd.DataFrame(scaled, columns=FEATURE_COLS)
    p = calibrated.predict_proba(scaled_df)[0]
    print(f"  {label}")
    print(f"    → Normal: {p[0]:.3f} | Stroke Risk: {p[1]:.3f}")

joblib.dump({"model": calibrated, "scaler": scaler}, "stroke_model.pkl")
print("\n✅ stroke_model.pkl saved (v2 — realistic overlap)")