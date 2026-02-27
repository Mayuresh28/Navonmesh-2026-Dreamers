import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — prevents plt.show() from blocking
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score

############################################
# LOAD DATA
############################################

df = pd.read_csv("synthetic_ncm_dataset.csv")

print("\nDataset Preview:\n")
print(df.head())
print(f"\nTotal samples: {len(df)}")

############################################
# FEATURE SETS
############################################

# ECG model — heart_rate + HRV (direct cardiac indicators)
X_ecg = df[["heart_rate", "hrv_sdnn"]]
y_ecg = df["cardiac_risk"]

# EEG model — stress_ratio (beta/alpha power ratio)
X_eeg = df[["stress_ratio"]]
y_eeg = df["stress_label"]

# EMG model — emg_rms (muscle activation level)
X_emg = df[["emg_rms"]]
y_emg = df["fatigue_label"]

############################################
# SPLIT DATA
############################################

def prepare_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y  # stratified split preserves class ratio
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler


############################################
# MODEL CONFIGS — tuned per signal type
############################################

MODEL_CONFIGS = {
    # ECG: imbalanced (67/33), needs higher sensitivity for cardiac risk
    "ECG": GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        min_samples_leaf=10,
        subsample=0.8,
        random_state=42,
    ),
    # EEG: regularized to avoid overfitting on partially-separable stress_ratio
    "EEG": GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=20,
        subsample=0.7,
        random_state=42,
    ),
    # EMG: regularized for the emg_rms overlap zone
    "EMG": GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=20,
        subsample=0.7,
        random_state=42,
    ),
}


############################################
# TRAIN MODELS
############################################

def train_model(X, y, model_name):
    X_train, X_test, y_train, y_test, scaler = prepare_model(X, y)

    model = MODEL_CONFIGS[model_name]

    # For ECG: handle class imbalance by computing sample weights
    if model_name == "ECG":
        from sklearn.utils.class_weight import compute_sample_weight
        sample_weights = compute_sample_weight("balanced", y_train)
        model.fit(X_train, y_train, sample_weight=sample_weights)
    else:
        model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # Cross-validation for honest accuracy estimate
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, np.vstack([X_train, X_test]),
                                pd.concat([y_train, y_test]),
                                cv=cv, scoring='accuracy')

    print(f"\n===== {model_name} =====")
    print(f"Test Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"CV Accuracy   : {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(classification_report(y_test, y_pred))

    joblib.dump(model, f"{model_name}_model.pkl")
    joblib.dump(scaler, f"{model_name}_scaler.pkl")

    return model, scaler


print("\nTraining Models...")

ecg_model, ecg_scaler = train_model(X_ecg, y_ecg, "ECG")
eeg_model, eeg_scaler = train_model(X_eeg, y_eeg, "EEG")
emg_model, emg_scaler = train_model(X_emg, y_emg, "EMG")

############################################
# NCM PREDICTION FUNCTION
############################################

def predict_ncm(heart_rate, hrv_sdnn, stress_ratio, emg_rms):

    # Validate inputs — clamp to realistic physiological ranges
    heart_rate  = np.clip(heart_rate, 40, 200)     # bpm (normal resting: 60-100, exercise: up to 200)
    hrv_sdnn    = np.clip(hrv_sdnn, 5, 300)        # ms  (healthy: 30-100, stressed: <20)
    stress_ratio = np.clip(stress_ratio, 0.01, 60) # beta/alpha ratio
    emg_rms     = np.clip(emg_rms, 0.05, 2.0)     # mV

    # Load models
    ecg_model = joblib.load("ECG_model.pkl")
    eeg_model = joblib.load("EEG_model.pkl")
    emg_model = joblib.load("EMG_model.pkl")

    ecg_scaler = joblib.load("ECG_scaler.pkl")
    eeg_scaler = joblib.load("EEG_scaler.pkl")
    emg_scaler = joblib.load("EMG_scaler.pkl")

    # Prepare input
    ecg_input = ecg_scaler.transform([[heart_rate, hrv_sdnn]])
    eeg_input = eeg_scaler.transform([[stress_ratio]])
    emg_input = emg_scaler.transform([[emg_rms]])

    ecg_prob = ecg_model.predict_proba(ecg_input)[0][1]
    eeg_prob = eeg_model.predict_proba(eeg_input)[0][1]
    emg_prob = emg_model.predict_proba(emg_input)[0][1]

    # Fusion score
    NCM_index = (0.4*ecg_prob + 0.35*eeg_prob + 0.25*emg_prob) * 100

    ############################################
    # INTERPRETATION
    ############################################

    cardiac_state = "High Cardiac Risk" if ecg_prob > 0.5 else "Normal Cardiac"
    stress_state = "High Stress" if eeg_prob > 0.5 else "Relaxed"
    muscle_state = "Muscle Fatigue" if emg_prob > 0.5 else "Normal Muscle"

    systemic_flag = "Stable"

    if ecg_prob > 0.6 and eeg_prob > 0.6:
        systemic_flag = "Autonomic Overload Risk"

    if eeg_prob > 0.7 and emg_prob > 0.7:
        systemic_flag = "Chronic Stress + Fatigue Risk"

    print("\n========== NCM HEALTH REPORT ==========")
    print("Cardiac State:", cardiac_state)
    print("Stress State:", stress_state)
    print("Muscle State:", muscle_state)
    print("Systemic Interpretation:", systemic_flag)
    print("NCM Index:", round(NCM_index,2), "/ 100")
    print("========================================\n")


############################################
# TEST ON RANDOM SAMPLE
############################################

sample = df.sample(1)

heart_rate_sample = sample["heart_rate"].values[0]
hrv_sdnn_sample = sample["hrv_sdnn"].values[0]
stress_ratio_sample = sample["stress_ratio"].values[0]
emg_rms_sample = sample["emg_rms"].values[0]

predict_ncm(heart_rate_sample, hrv_sdnn_sample, stress_ratio_sample, emg_rms_sample)

############################################
# FEATURE IMPORTANCE VISUALIZATION
############################################

import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def show_feature_importance(model, features, title):

    importance = model.feature_importances_
    plt.figure(figsize=(8, 4))
    plt.barh(features, importance, color='steelblue')
    plt.xlabel('Importance')
    plt.title(title)
    plt.tight_layout()
    filename = os.path.join(SCRIPT_DIR, title.replace(" ", "_") + ".png")
    plt.savefig(filename, bbox_inches="tight")
    plt.close()
    print(f"Saved plot: {filename}")


show_feature_importance(ecg_model, ["heart_rate", "hrv_sdnn"], "ECG Feature Importance")
show_feature_importance(eeg_model, ["stress_ratio"], "EEG Feature Importance")
show_feature_importance(emg_model, ["emg_rms"], "EMG Feature Importance")

print("\n✓ All models trained and plots saved successfully!")