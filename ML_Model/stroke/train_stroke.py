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

# Import preprocessing
sys.path.append(os.path.abspath("../"))
from utils.preprocessing import preprocessing_stroke

# =============================
# 1️⃣ Load Dataset
# =============================
df = pd.read_csv("../data/synthetic/stroke_synthetic_10k.csv")

# =============================
# 2️⃣ Feature Engineering
# =============================
df = preprocessing_stroke(df)

X = df.drop("Stroke", axis=1)
y = df["Stroke"]

# =============================
# 3️⃣ Stratified Split
# =============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# =============================
# 4️⃣ Model Definition
# =============================
model = XGBClassifier(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss"
)

model.fit(X_train, y_train)

# =============================
# 5️⃣ Probability Predictions
# =============================
y_prob = model.predict_proba(X_test)[:, 1]

# =============================
# 6️⃣ Base Performance
# =============================
print("\n===== BASE PERFORMANCE (Threshold = 0.50) =====")
y_pred_default = (y_prob > 0.50).astype(int)

print("Accuracy:", accuracy_score(y_test, y_pred_default))
print("Recall:", recall_score(y_test, y_pred_default))
print("AUC:", roc_auc_score(y_test, y_prob))
print("\nClassification Report:")
print(classification_report(y_test, y_pred_default))

# =============================
# 7️⃣ Threshold Optimization (Youden’s J)
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
# 8️⃣ Calibration
# =============================
calibrated_model = CalibratedClassifierCV(model, method='sigmoid')
calibrated_model.fit(X_train, y_train)

joblib.dump({
    "model": calibrated_model,
    "threshold": float(best_threshold)
}, "stroke_model.pkl")

print("\nCalibrated stroke model saved successfully!")