import joblib
import numpy as np

# Load models correctly
ecg_model = joblib.load("./ECG/ECG_model.pkl")["model"]
eeg_model = joblib.load("./EEG/EEG_model.pkl")["model"]
emg_model = joblib.load("./EMG/EMG_model.pkl")["model"]

print("\n========== SIGNAL MODEL DEBUG ==========\n")

test_samples = [
    {"hr": 65, "bp": 110, "steps": 9000, "sleep": 8},
    {"hr": 75, "bp": 125, "steps": 5000, "sleep": 6},
    {"hr": 110, "bp": 160, "steps": 2000, "sleep": 4},
    {"hr": 85, "bp": 130, "steps": 500, "sleep": 5},
    {"hr": 55, "bp": 105, "steps": 12000, "sleep": 8},
    {"hr": 95, "bp": 140, "steps": 4000, "sleep": 3},
    {"hr": 120, "bp": 170, "steps": 1000, "sleep": 3},
    {"hr": 80, "bp": 120, "steps": 6000, "sleep": 7},
    {"hr": 90, "bp": 135, "steps": 3000, "sleep": 4},
    {"hr": 70, "bp": 115, "steps": 8000, "sleep": 8},
]

for i, p in enumerate(test_samples):

    heart_rate = p["hr"]
    hrv_sdnn = 100 - heart_rate * 0.5
    stress_ratio = p["bp"] / p["hr"]
    emg_rms = p["steps"] / 10000
    sleep_hours = p["sleep"]

    ecg_features = np.array([[heart_rate, hrv_sdnn]])
    eeg_features = np.array([[stress_ratio, sleep_hours]])
    emg_features = np.array([[emg_rms, p["steps"]]])

    ecg_prob = ecg_model.predict_proba(ecg_features)[0]
    eeg_prob = eeg_model.predict_proba(eeg_features)[0]
    emg_prob = emg_model.predict_proba(emg_features)[0]

    print(f"\nSample {i+1}")
    print("ECG:", ecg_prob)
    print("EEG:", eeg_prob)
    print("EMG:", emg_prob)

print("\n=========================================")