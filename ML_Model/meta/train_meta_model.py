"""
Meta Model Training & Validation Script
========================================
Trains XGBoost stacked meta-classifier on fused biomedical signals.
Includes:
  - Stratified train/val/test split
  - Early stopping to prevent overfitting
  - Full classification report
  - Confusion matrix
  - Per-class probability calibration check
  - Learning curve plot
  - Saves meta_model.pkl
"""
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    classification_report, accuracy_score,
    confusion_matrix, log_loss
)
from sklearn.preprocessing import LabelEncoder
from sklearn.calibration import CalibratedClassifierCV
from xgboost import XGBClassifier

CLASS_NAMES = [
    "CHD", "Stroke", "Diabetes", "Hypertension",
    "Arrhythmia", "Metabolic", "Neuro", "Epilepsy", "Healthy"
]

# ── Load ───────────────────────────────────────────────────────────────────────
df = pd.read_csv("meta_dataset_realistic_balanced.csv")
X = df.drop("Disease_Class", axis=1)
y = df["Disease_Class"]

le = LabelEncoder()
y_enc = le.fit_transform(y)
num_classes = len(np.unique(y_enc))
print(f"Loaded {len(df):,} samples | {num_classes} classes | {X.shape[1]} features")

# ── Three-way split: 70% train / 15% val / 15% test ───────────────────────────
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y_enc, test_size=0.30, random_state=42, stratify=y_enc
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
)
print(f"Split → Train: {len(X_train):,} | Val: {len(X_val):,} | Test: {len(X_test):,}")

# ── Model ──────────────────────────────────────────────────────────────────────
model = XGBClassifier(
    n_estimators=1000,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    objective="multi:softprob",
    num_class=num_classes,
    eval_metric="mlogloss",
    tree_method="hist",
    early_stopping_rounds=50,      # Stop if val loss doesn't improve
    random_state=42,
    verbosity=0
)

print("\nTraining with early stopping on validation set...")
model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_val, y_val)],
    verbose=False
)

best_iter = model.best_iteration
print(f"Best iteration: {best_iter} (early stopping active)")

# ── Evaluation on TEST set (held-out, never seen during training) ──────────────
y_pred       = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)

test_accuracy = accuracy_score(y_test, y_pred)
test_logloss  = log_loss(y_test, y_pred_proba)

print(f"\n{'='*55}")
print(f"  FINAL TEST SET RESULTS")
print(f"{'='*55}")
print(f"  Accuracy  : {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
print(f"  Log Loss  : {test_logloss:.4f}  (lower = better calibrated)")

print(f"\n  Classification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=CLASS_NAMES,
    digits=3
))

# ── Cross-validation sanity check ─────────────────────────────────────────────
print("Running 5-fold cross-validation (this may take a moment)...")
cv_model = XGBClassifier(
    n_estimators=best_iter,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    objective="multi:softprob",
    num_class=num_classes,
    eval_metric="mlogloss",
    tree_method="hist",
    random_state=42,
    verbosity=0
)
cv_scores = cross_val_score(cv_model, X, y_enc, cv=5, scoring="accuracy", n_jobs=-1)
print(f"\n  Cross-Val Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"  Fold scores: {[round(s, 4) for s in cv_scores]}")

overfit_gap = test_accuracy - cv_scores.mean()
if abs(overfit_gap) < 0.03:
    print("  ✅ No significant overfitting detected")
elif test_accuracy > cv_scores.mean() + 0.03:
    print("  ⚠️  Possible overfitting — test score much higher than CV")
else:
    print("  ⚠️  Possible underfitting — CV score higher than test")

# ── Confusion Matrix ───────────────────────────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(11, 9))
sns.heatmap(
    cm, annot=True, fmt="d", cmap="Blues",
    xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
    linewidths=0.5
)
plt.title("Meta Model — Confusion Matrix (Test Set)", fontsize=14, fontweight="bold")
plt.ylabel("True Label", fontsize=12)
plt.xlabel("Predicted Label", fontsize=12)
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.savefig("meta_confusion_matrix.png", dpi=150)
plt.close()
print("\n  Confusion matrix saved → meta_confusion_matrix.png")

# ── Learning Curve (train vs val loss) ────────────────────────────────────────
results   = model.evals_result()
train_loss = results["validation_0"]["mlogloss"]
val_loss   = results["validation_1"]["mlogloss"]

plt.figure(figsize=(10, 5))
plt.plot(train_loss, label="Train Log Loss", color="#2196F3", linewidth=1.5)
plt.plot(val_loss,   label="Val Log Loss",   color="#F44336", linewidth=1.5)
plt.axvline(best_iter, color="green", linestyle="--", label=f"Best iter ({best_iter})")
plt.title("Meta Model — Learning Curve", fontsize=14, fontweight="bold")
plt.xlabel("Boosting Round")
plt.ylabel("Log Loss")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("meta_learning_curve.png", dpi=150)
plt.close()
print("  Learning curve saved → meta_learning_curve.png")

# ── Feature Importance ─────────────────────────────────────────────────────────
importances = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=True)

plt.figure(figsize=(9, 6))
importances.plot(kind="barh", color="#4CAF50", edgecolor="white")
plt.title("Meta Model — Feature Importance", fontsize=14, fontweight="bold")
plt.xlabel("Importance Score")
plt.tight_layout()
plt.savefig("meta_feature_importance.png", dpi=150)
plt.close()
print("  Feature importance saved → meta_feature_importance.png")

# ── Probability sanity check ───────────────────────────────────────────────────
print(f"\n{'='*55}")
print("  PROBABILITY SANITY CHECKS")
print(f"{'='*55}")
sanity_cases = [
    ("Clear CHD",          [0.85, 0.35, 0.38, 0.80, 0.28, 0.30, None, None, None, None, None, None]),
    ("Clear Stroke",       [0.38, 0.38, 0.82, 0.32, 0.74, 0.42, None, None, None, None, None, None]),
    ("Clear Diabetes",     [0.35, 0.85, 0.32, 0.30, 0.28, 0.30, None, None, None, None, None, None]),
    ("Clear Epilepsy",     [0.25, 0.25, 0.38, 0.28, 0.85, 0.82, None, None, None, None, None, None]),
    ("Healthy",            [0.18, 0.18, 0.18, 0.20, 0.20, 0.22, None, None, None, None, None, None]),
    ("Ambiguous mixed",    [0.55, 0.55, 0.55, 0.52, 0.52, 0.50, None, None, None, None, None, None]),
]

feature_cols = list(X.columns)

for name, vals in sanity_cases:
    heart_p, diab_p, stroke_p, ecg_p, eeg_p, emg_p = vals[:6]
    static   = 0.25*heart_p + 0.25*diab_p + 0.20*stroke_p + 0.15*ecg_p + 0.15*eeg_p
    cardio   = (heart_p + ecg_p) / 2
    neuro    = (stroke_p + eeg_p + emg_p) / 3
    metab    = (diab_p + static) / 2
    fatigue  = (emg_p + eeg_p) / 2
    ncm      = (0.22*heart_p + 0.22*diab_p + 0.20*stroke_p + 0.14*ecg_p + 0.12*eeg_p + 0.10*static) * 100

    row = pd.DataFrame([[heart_p, diab_p, stroke_p, ecg_p, eeg_p, emg_p,
                         static, ncm, cardio, neuro, metab, fatigue]],
                       columns=feature_cols)

    proba   = model.predict_proba(row)[0]
    pred_id = int(np.argmax(proba))
    conf    = proba[pred_id]

    print(f"\n  [{name}]")
    print(f"    Prediction : {CLASS_NAMES[pred_id]} ({conf:.3f} confidence)")
    top3 = np.argsort(proba)[::-1][:3]
    for i in top3:
        bar = "█" * int(proba[i] * 30)
        print(f"    {CLASS_NAMES[i]:15s}: {proba[i]:.3f}  {bar}")

# ── Save ───────────────────────────────────────────────────────────────────────
joblib.dump({"model": model, "label_encoder": le}, "meta_model.pkl")
print(f"\n{'='*55}")
print("  ✅ meta_model.pkl saved")
print(f"{'='*55}")