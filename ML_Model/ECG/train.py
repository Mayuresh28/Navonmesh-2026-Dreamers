"""
ECG Model Training — Properly calibrated binary classifier
- GradientBoosting + Isotonic Calibration
- StandardScaler stored alongside model
- Outputs: ECG_model.pkl
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, brier_score_loss

# ── Load ──────────────────────────────────────────────────────────────────────
df = pd.read_csv("ECG_dataset_realistic.csv")
X = df[["HeartRate", "HRV_SDNN"]].values
y = df["Label"].values

# ── Scale ─────────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Split ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train base model ──────────────────────────────────────────────────────────
base = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=3,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
base.fit(X_train, y_train)

# ── Calibrate ─────────────────────────────────────────────────────────────────
calibrated = CalibratedClassifierCV(base, method="isotonic", cv=5)
calibrated.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred  = calibrated.predict(X_test)
y_proba = calibrated.predict_proba(X_test)[:, 1]

print("=" * 50)
print("ECG MODEL EVALUATION")
print("=" * 50)
print(classification_report(y_test, y_pred, target_names=["Normal", "Arrhythmia"]))
print(f"Brier Score (lower=better): {brier_score_loss(y_test, y_proba):.4f}")

# ── Sanity checks ─────────────────────────────────────────────────────────────
print("\n── Probability Sanity Checks ──")
test_cases = [
    ("Healthy HR=70, HRV=65",  [[70,  65]]),
    ("Moderate HR=95, HRV=45", [[95,  45]]),
    ("Arrhythmia HR=135, HRV=15", [[135, 15]]),
]
for label, raw in test_cases:
    scaled = scaler.transform(raw)
    prob = calibrated.predict_proba(scaled)[0]
    print(f"  {label:35s} → Normal: {prob[0]:.3f} | Arrhythmia: {prob[1]:.3f}")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump({"model": calibrated, "scaler": scaler}, "ECG_model.pkl")
print("\n✅ ECG model saved → ECG_model.pkl")