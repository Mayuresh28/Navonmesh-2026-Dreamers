import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

print("\n========== TRAINING EMG MODEL (XGBOOST) ==========\n")

# ==========================================
# LOAD DATA
# ==========================================

df = pd.read_csv("../data/data/emg_synthetic_10k.csv")

X = df.drop("EMG_Abnormal", axis=1)
y = df["EMG_Abnormal"]

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
# HANDLE CLASS IMBALANCE
# ==========================================

neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
scale_weight = neg / pos

print("\nScale Pos Weight:", round(scale_weight, 2))

# ==========================================
# BASE MODEL (XGBOOST)
# ==========================================

base_model = XGBClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_weight,
    eval_metric="logloss",
    use_label_encoder=False,
    random_state=42
)

# ==========================================
# CALIBRATION
# ==========================================

model = CalibratedClassifierCV(base_model, cv=5)

model.fit(X_train, y_train)

# ==========================================
# EVALUATION
# ==========================================

y_pred = model.predict(X_test)

print("\nTest Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump({
    "model": model,
    "threshold": 0.5
}, "EMG_model.pkl")

print("\nEMG XGBoost model saved successfully!")
print("\n=================================================\n")