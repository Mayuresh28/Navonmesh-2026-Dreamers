import os
import numpy as np
import neurokit2 as nk
import pandas as pd
from scipy.signal import welch
from tqdm import tqdm
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

############################################
# PARAMETERS
############################################

NUM_SAMPLES = 2000

ECG_FS = 250      # 10 seconds
EEG_FS = 128      # 5 seconds
EMG_FS = 1000     # 3 seconds

ECG_DURATION = 10
EEG_DURATION = 5
EMG_DURATION = 3

############################################
# ECG GENERATION
# - Gaussian HR distributions with overlap zone
# - Extracts HRV (SDNN) as second feature
############################################

def generate_ecg():
    cardiac_risk = random.choice([0, 0, 1])  # ~33% positive rate

    if cardiac_risk == 0:
        heart_rate = random.gauss(72, 12)        # normal: mean 72 bpm
        heart_rate = max(45, min(heart_rate, 105))
    else:
        heart_rate = random.gauss(115, 18)       # at-risk: mean 115 bpm
        heart_rate = max(75, min(heart_rate, 160))

    ecg = nk.ecg_simulate(
        duration=ECG_DURATION,
        heart_rate=int(heart_rate),
        sampling_rate=ECG_FS
    )

    # Extract HRV — lower HRV correlates with higher cardiac risk
    try:
        signals, info = nk.ecg_process(ecg, sampling_rate=ECG_FS)
        hrv = nk.hrv_time(info, sampling_rate=ECG_FS)
        hrv_sdnn = hrv["HRV_SDNN"].values[0]
    except Exception:
        hrv_sdnn = random.gauss(50, 15)

    # Add noise so HRV isn't a perfect separator
    hrv_sdnn += random.gauss(0, 10)
    hrv_sdnn = max(5, hrv_sdnn)

    return heart_rate, hrv_sdnn, cardiac_risk


############################################
# EEG GENERATION
############################################

def bandpower(freqs, psd, low, high):
    idx = np.logical_and(freqs >= low, freqs <= high)
    return np.trapz(psd[idx], freqs[idx])

def generate_eeg():
    stress_state = random.choice(["low", "high"])

    t = np.linspace(0, EEG_DURATION, EEG_FS * EEG_DURATION)

    alpha_wave = np.sin(2 * np.pi * 10 * t)  # 10 Hz
    beta_wave = np.sin(2 * np.pi * 20 * t)   # 20 Hz
    noise = np.random.normal(0, 0.5, len(t))

    if stress_state == "low":
        # Primarily alpha, but significant beta variability for overlap
        alpha_amp = random.uniform(0.6, 1.5)
        beta_amp = random.uniform(0.0, 1.0)
        eeg = alpha_wave * alpha_amp + beta_wave * beta_amp + noise
        stress_label = 0
    else:
        # Primarily beta, but significant alpha variability for overlap
        alpha_amp = random.uniform(0.2, 1.0)
        beta_amp = random.uniform(0.6, 2.0)
        eeg = alpha_wave * alpha_amp + beta_wave * beta_amp + noise
        stress_label = 1

    freqs, psd = welch(eeg, EEG_FS)

    alpha_power = bandpower(freqs, psd, 8, 13)
    beta_power = bandpower(freqs, psd, 13, 30)
    stress_ratio = beta_power / alpha_power if alpha_power > 0.001 else 0

    return eeg, stress_ratio, stress_label


############################################
# EMG GENERATION
############################################

def generate_emg():
    fatigue_state = random.choice(["low", "high"])

    t = np.linspace(0, EMG_DURATION, EMG_FS * EMG_DURATION)

    if fatigue_state == "low":
        # Normal muscle: lower amplitude, but with variability
        amplitude = random.uniform(0.15, 0.40)
        muscle_signal = np.random.normal(0, amplitude, len(t))
        fatigue_label = 0
    else:
        # Fatigued muscle: higher amplitude, but overlaps with normal
        amplitude = random.uniform(0.35, 1.2)
        muscle_signal = np.random.normal(0, amplitude, len(t))
        fatigue_label = 1

    rms = np.sqrt(np.mean(muscle_signal**2))

    return muscle_signal, rms, fatigue_label


############################################
# DATASET GENERATION
############################################

def generate_dataset():

    dataset = []

    for _ in tqdm(range(NUM_SAMPLES)):

        heart_rate, hrv_sdnn, cardiac_label = generate_ecg()
        eeg, stress_ratio, stress_label = generate_eeg()
        emg, rms, fatigue_label = generate_emg()

        sample = {
            "cardiac_risk": cardiac_label,
            "stress_label": stress_label,
            "fatigue_label": fatigue_label,
            "heart_rate": round(heart_rate, 2),
            "hrv_sdnn": round(hrv_sdnn, 2),
            "stress_ratio": round(stress_ratio, 6),
            "emg_rms": round(rms, 6)
        }

        dataset.append(sample)

    df = pd.DataFrame(dataset)
    output_path = os.path.join(SCRIPT_DIR, "synthetic_ncm_dataset.csv")
    df.to_csv(output_path, index=False)

    print("\n✅ Dataset Generated Successfully")
    print("Saved to:", output_path)
    print("Total Samples:", len(df))
    print("\nLabel Distribution:")
    print(f"  cardiac_risk: {df['cardiac_risk'].value_counts().to_dict()}")
    print(f"  stress_label: {df['stress_label'].value_counts().to_dict()}")
    print(f"  fatigue_label: {df['fatigue_label'].value_counts().to_dict()}")
    print("\nFeature Stats:")
    print(df[["heart_rate", "hrv_sdnn", "stress_ratio", "emg_rms"]].describe())


############################################
# MAIN
############################################

if __name__ == "__main__":
    generate_dataset()
    