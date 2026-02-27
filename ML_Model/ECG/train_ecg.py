import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score

print("\n========== TRAINING ECG MODEL ==========\n")

# ==========================================
# LOAD DATA
# ==========================================

df = pd.read_csv("../data/data/ecg_synthetic_10k.csv")

X = df.drop("ECG_Abnormal", axis=1)
y = df["ECG_Abnormal"]

print("Dataset Shape:", df.shape)
print("\nClass Distribution:\n", y.value_counts(normalize=True))

# ==========================================
# TRAIN TEST SPLIT (STRATIFIED)
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ==========================================
# BASE MODEL
# ==========================================

base_model = GradientBoostingClassifier(
    n_estimators=250,
    learning_rate=0.05,
    max_depth=3,
    random_state=42
)

# ==========================================
# CALIBRATION (VERY IMPORTANT)
# ==========================================

model = CalibratedClassifierCV(base_model, cv=5)

model.fit(X_train, y_train)

# ==========================================
# EVALUATION
# ==========================================

y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\nTest Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump({
    "model": model,
    "threshold": 0.5
}, "ECG_model.pkl")

print("\nECG model saved successfully!")
print("\n=========================================\n")