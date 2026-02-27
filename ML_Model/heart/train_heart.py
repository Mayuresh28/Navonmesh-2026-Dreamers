import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    recall_score,
    roc_auc_score,
    classification_report,
    roc_curve
)
from sklearn.calibration import CalibratedClassifierCV
from xgboost import XGBClassifier
import joblib
import sys
import os

sys.path.append(os.path.abspath("../"))
from utils.preprocessing import preprocess_heart

# =============================
# 1. Load Dataset
# =============================
df = pd.read_csv("../data/synthetic/heart_synthetic_10k.csv")

# =============================
# 2. Feature Engineering
# =============================
df = preprocess_heart(df)

X = df.drop("HeartDisease", axis=1)
y = df["HeartDisease"]

# =============================
# 3. Stratified Train-Test Split
# =============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# =============================
# 4. Handle Imbalance
# =============================
scale_weight = len(y_train[y_train == 0]) / len(y_train[y_train == 1])

model = XGBClassifier(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_weight,
    eval_metric="logloss"
)

model.fit(X_train, y_train)

# =============================
# 5. Get Probabilities
# =============================
y_prob = model.predict_proba(X_test)[:, 1]

# =============================
# 6. Base Performance (0.50 threshold)
# =============================
print("\n===== BASE PERFORMANCE (Threshold = 0.50) =====")
y_pred_default = (y_prob > 0.50).astype(int)

print("Accuracy:", accuracy_score(y_test, y_pred_default))
print("Recall:", recall_score(y_test, y_pred_default))
print("AUC:", roc_auc_score(y_test, y_prob))
print("\nClassification Report:")
print(classification_report(y_test, y_pred_default))

# =============================
# 7. Threshold Optimization (Youden’s J)
# =============================
fpr, tpr, thresholds = roc_curve(y_test, y_prob)

j_scores = tpr - fpr
best_index = np.argmax(j_scores)
best_threshold = thresholds[best_index]

print("\nBest Threshold (Youden's J):", round(best_threshold, 4))

y_pred_opt = (y_prob > best_threshold).astype(int)

print("\n===== OPTIMIZED PERFORMANCE =====")
print("Accuracy:", accuracy_score(y_test, y_pred_opt))
print("Recall:", recall_score(y_test, y_pred_opt))
print("AUC:", roc_auc_score(y_test, y_prob))
print("\nClassification Report:")
print(classification_report(y_test, y_pred_opt))

# =============================
# 8. Calibration (Medical Reliability)
# =============================
calibrated_model = CalibratedClassifierCV(model, method='sigmoid')
calibrated_model.fit(X_train, y_train)

joblib.dump({
    "model": calibrated_model,
    "threshold": float(best_threshold)
}, "heart_model.pkl")

print("\nCalibrated model + optimal threshold saved successfully!")