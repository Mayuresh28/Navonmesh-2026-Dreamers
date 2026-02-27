"""
Meta Model Dataset Generator — Balanced & Realistic
=====================================================
Generates 40,000 samples across 9 disease classes with
controlled class balance so the meta model learns all
conditions equally, not just "Healthy".

Target distribution (approximate):
  Each of 9 classes gets 8-14% of samples
"""
import numpy as np
import pandas as pd
from scipy.special import softmax

np.random.seed(42)

CLASS_NAMES = {
    0: "CHD",
    1: "Stroke",
    2: "Diabetes",
    3: "Hypertension",
    4: "Arrhythmia",
    5: "Metabolic Syndrome",
    6: "Neuro Disorder",
    7: "Epilepsy",
    8: "Healthy"
}

# ── Per-class probability profiles ────────────────────────────────────────────
# Each entry: mean for [heart, diabetes, stroke, ecg, eeg, emg]
# Values are (mu, sigma) for a truncated normal in [0,1]
PROFILES = {
    0: dict(  # CHD — high heart + ECG
        heart=(0.78, 0.10), diabetes=(0.40, 0.12), stroke=(0.40, 0.12),
        ecg=(0.72, 0.10),   eeg=(0.30, 0.10),      emg=(0.35, 0.10)
    ),
    1: dict(  # Stroke — high stroke + EEG
        heart=(0.45, 0.12), diabetes=(0.42, 0.12), stroke=(0.78, 0.10),
        ecg=(0.38, 0.10),   eeg=(0.70, 0.10),      emg=(0.40, 0.10)
    ),
    2: dict(  # Diabetes — high diabetes + metabolic
        heart=(0.42, 0.12), diabetes=(0.80, 0.10), stroke=(0.38, 0.12),
        ecg=(0.35, 0.10),   eeg=(0.30, 0.10),      emg=(0.38, 0.10)
    ),
    3: dict(  # Hypertension — elevated static risk across board
        heart=(0.65, 0.10), diabetes=(0.60, 0.10), stroke=(0.62, 0.10),
        ecg=(0.55, 0.10),   eeg=(0.45, 0.10),      emg=(0.42, 0.10)
    ),
    4: dict(  # Arrhythmia — high ECG signal, moderate heart
        heart=(0.50, 0.12), diabetes=(0.32, 0.10), stroke=(0.35, 0.10),
        ecg=(0.82, 0.10),   eeg=(0.35, 0.10),      emg=(0.32, 0.10)
    ),
    5: dict(  # Metabolic Syndrome — high diabetes + heart + static
        heart=(0.62, 0.10), diabetes=(0.72, 0.10), stroke=(0.45, 0.10),
        ecg=(0.48, 0.10),   eeg=(0.35, 0.10),      emg=(0.38, 0.10)
    ),
    6: dict(  # Neuro Disorder — high EEG + EMG + stroke moderate
        heart=(0.32, 0.10), diabetes=(0.30, 0.10), stroke=(0.55, 0.10),
        ecg=(0.30, 0.10),   eeg=(0.72, 0.10),      emg=(0.68, 0.10)
    ),
    7: dict(  # Epilepsy — very high EEG + EMG
        heart=(0.28, 0.10), diabetes=(0.28, 0.10), stroke=(0.42, 0.10),
        ecg=(0.30, 0.10),   eeg=(0.82, 0.10),      emg=(0.78, 0.10)
    ),
    8: dict(  # Healthy — all low
        heart=(0.22, 0.08), diabetes=(0.20, 0.08), stroke=(0.20, 0.08),
        ecg=(0.22, 0.08),   eeg=(0.22, 0.08),      emg=(0.25, 0.08)
    ),
}

# Target samples per class (roughly balanced, total ~40000)
SAMPLES_PER_CLASS = {
    0: 4200,   # CHD
    1: 4500,   # Stroke
    2: 4500,   # Diabetes
    3: 4000,   # Hypertension
    4: 4500,   # Arrhythmia
    5: 4000,   # Metabolic Syndrome
    6: 4000,   # Neuro Disorder
    7: 4300,   # Epilepsy
    8: 6000,   # Healthy (slightly more — most common in real world)
}

def sample_clipped(mu, sigma, size):
    """Sample from normal, clipped to [0.01, 0.99]"""
    return np.clip(np.random.normal(mu, sigma, size), 0.01, 0.99)


# ── Generate per-class rows ────────────────────────────────────────────────────
all_rows = []

for cls, n in SAMPLES_PER_CLASS.items():
    p = PROFILES[cls]

    heart_prob    = sample_clipped(*p["heart"],    n)
    diabetes_prob = sample_clipped(*p["diabetes"], n)
    stroke_prob   = sample_clipped(*p["stroke"],   n)
    ecg_prob      = sample_clipped(*p["ecg"],      n)
    eeg_prob      = sample_clipped(*p["eeg"],      n)
    emg_prob      = sample_clipped(*p["emg"],      n)

    # ── Engineered features ──────────────────────────────────────────────────
    static_risk = (
        0.25 * heart_prob +
        0.25 * diabetes_prob +
        0.20 * stroke_prob +
        0.15 * ecg_prob +
        0.15 * eeg_prob
    )
    cardio_combined    = (heart_prob + ecg_prob) / 2
    neuro_combined     = (stroke_prob + eeg_prob + emg_prob) / 3
    metabolic_combined = (diabetes_prob + static_risk) / 2
    fatigue_index      = (emg_prob + eeg_prob) / 2
    ncm_index = (
        0.22 * heart_prob +
        0.22 * diabetes_prob +
        0.20 * stroke_prob +
        0.14 * ecg_prob +
        0.12 * eeg_prob +
        0.10 * static_risk
    ) * 100

    # ── Add small within-class overlap noise (5% label flip) ────────────────
    labels = np.full(n, cls)
    flip_mask = np.random.rand(n) < 0.05
    labels[flip_mask] = np.random.randint(0, 9, flip_mask.sum())

    chunk = pd.DataFrame({
        "heart_prob":        heart_prob,
        "diabetes_prob":     diabetes_prob,
        "stroke_prob":       stroke_prob,
        "ecg_prob":          ecg_prob,
        "eeg_prob":          eeg_prob,
        "emg_prob":          emg_prob,
        "static_risk":       static_risk,
        "ncm_index":         ncm_index,
        "cardio_combined":   cardio_combined,
        "neuro_combined":    neuro_combined,
        "metabolic_combined":metabolic_combined,
        "fatigue_index":     fatigue_index,
        "Disease_Class":     labels.astype(int)
    })
    all_rows.append(chunk)

# ── Combine and shuffle ────────────────────────────────────────────────────────
df = pd.concat(all_rows, ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

df.to_csv("meta_dataset_realistic_balanced.csv", index=False)

# ── Report ─────────────────────────────────────────────────────────────────────
print("=" * 55)
print("  Meta Dataset Generated")
print("=" * 55)
print(f"  Total samples : {len(df):,}")
print(f"  Features      : {df.shape[1] - 1}")
print()
print("  Class Distribution:")
dist = df["Disease_Class"].value_counts(normalize=True).sort_index()
for cls_id, pct in dist.items():
    count = int(pct * len(df))
    bar = "█" * int(pct * 50)
    print(f"  {cls_id} {CLASS_NAMES[cls_id]:20s}: {pct:.3f}  {bar}")
print()
print("  Feature Ranges:")
print(df.describe().loc[["min","mean","max"]].round(3).to_string())
print()
print("✅ Saved → meta_dataset_realistic_balanced.csv")