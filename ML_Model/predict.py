"""
Biomedical Signal Prediction Helper
Looks for models in subfolders: ECG/, EEG/, EMG/

Usage:
    from predict_signals import predict_ecg, predict_eeg, predict_emg

    print(predict_ecg(heart_rate=95, hrv_sdnn=40))
    print(predict_eeg(stress_ratio=1.8, sleep_hours=5.5))
    print(predict_emg(emg_rms=0.75, steps=2500))
"""
import joblib
import numpy as np
import os

_BASE = os.path.dirname(os.path.abspath(__file__))


def _load(name):
    """Load model + scaler from ML_Model/<name>/<name>_model.pkl"""
    path = os.path.join(_BASE, name, f"{name}_model.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Model not found at: {path}\n"
            f"Make sure you ran train.py inside the {name}/ folder first."
        )
    data = joblib.load(path)
    if not isinstance(data, dict) or "model" not in data or "scaler" not in data:
        raise ValueError(
            f"Old model format detected at: {path}\n"
            f"Please re-run train.py in the {name}/ folder to generate the updated model."
        )
    return data["model"], data["scaler"]


def predict_ecg(heart_rate: float, hrv_sdnn: float) -> dict:
    """
    Predict ECG class.
    Args:
        heart_rate : beats per minute (e.g. 72)
        hrv_sdnn   : HRV SDNN in ms (e.g. 55)
    Returns:
        dict with prediction, confidence, and probabilities
    """
    model, scaler = _load("ECG")
    X = scaler.transform([[heart_rate, hrv_sdnn]])
    proba = model.predict_proba(X)[0]
    classes = ["Normal", "Arrhythmia"]
    idx = int(np.argmax(proba))
    return {
        "prediction":    classes[idx],
        "confidence":    round(float(proba[idx]), 4),
        "probabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)}
    }


def predict_eeg(stress_ratio: float, sleep_hours: float) -> dict:
    """
    Predict EEG class.
    Args:
        stress_ratio : beta/alpha power ratio (e.g. 1.5)
        sleep_hours  : hours of sleep last night (e.g. 7.0)
    Returns:
        dict with prediction, confidence, and probabilities
    """
    model, scaler = _load("EEG")
    X = scaler.transform([[stress_ratio, sleep_hours]])
    proba = model.predict_proba(X)[0]
    classes = ["Normal", "Mild Neuro", "Epilepsy"]
    idx = int(np.argmax(proba))
    return {
        "prediction":    classes[idx],
        "confidence":    round(float(proba[idx]), 4),
        "probabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)}
    }


def predict_emg(emg_rms: float, steps: float) -> dict:
    """
    Predict EMG class.
    Args:
        emg_rms : root mean square of EMG signal (e.g. 0.45)
        steps   : daily step count (e.g. 6000)
    Returns:
        dict with prediction, confidence, and probabilities
    """
    model, scaler = _load("EMG")
    X = scaler.transform([[emg_rms, steps]])
    proba = model.predict_proba(X)[0]
    classes = ["Normal", "Abnormal"]
    idx = int(np.argmax(proba))
    return {
        "prediction":    classes[idx],
        "confidence":    round(float(proba[idx]), 4),
        "probabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)}
    }


if __name__ == "__main__":
    print("=== ECG Tests ===")
    print(predict_ecg(70,  65))    # Healthy
    print(predict_ecg(95,  40))    # Borderline
    print(predict_ecg(140, 12))    # Arrhythmia

    print("\n=== EEG Tests ===")
    print(predict_eeg(1.1, 8.0))   # Healthy
    print(predict_eeg(1.8, 5.5))   # Mild
    print(predict_eeg(2.8, 3.0))   # Epilepsy

    print("\n=== EMG Tests ===")
    print(predict_emg(0.38, 9000)) # Healthy
    print(predict_emg(0.60, 5000)) # Borderline
    print(predict_emg(0.85, 1800)) # Abnormal