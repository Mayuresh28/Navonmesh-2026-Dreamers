"""
EEG Model Training — Properly calibrated 3-class classifier
- GradientBoosting + Sigmoid Calibration
- StandardScaler stored alongside model
- Classes: 0=Normal, 1=Mild Neuro, 2=Epilepsy
- Outputs: EEG_model.pkl
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report

# ── Load ──────────────────────────────────────────────────────────────────────
df = pd.read_csv("EEG_dataset_realistic.csv")
X = df[["stress_ratio", "sleep_hours"]].values
y = df["Label"].values

# ── Scale ─────────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Split ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train ─────────────────────────────────────────────────────────────────────
base = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=3,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42
)
base.fit(X_train, y_train)

# Calibrate (sigmoid works well for multiclass)
calibrated = CalibratedClassifierCV(base, method="sigmoid", cv=5)
calibrated.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = calibrated.predict(X_test)

print("=" * 50)
print("EEG MODEL EVALUATION")
print("=" * 50)
print(classification_report(y_test, y_pred, target_names=["Normal", "Mild Neuro", "Epilepsy"]))

# ── Sanity checks ─────────────────────────────────────────────────────────────
print("\n── Probability Sanity Checks ──")
test_cases = [
    ("Healthy: stress=1.1, sleep=8.0",     [[1.1, 8.0]]),
    ("Moderate: stress=1.8, sleep=5.5",    [[1.8, 5.5]]),
    ("Epilepsy: stress=2.7, sleep=3.5",    [[2.7, 3.5]]),
    ("Sleep deprived: stress=1.3, sleep=3.0", [[1.3, 3.0]]),
]
for label, raw in test_cases:
    scaled = scaler.transform(raw)
    prob = calibrated.predict_proba(scaled)[0]
    print(f"  {label:45s} → Normal: {prob[0]:.3f} | Mild: {prob[1]:.3f} | Epilepsy: {prob[2]:.3f}")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump({"model": calibrated, "scaler": scaler}, "EEG_model.pkl")
print("\n✅ EEG model saved → EEG_model.pkl")