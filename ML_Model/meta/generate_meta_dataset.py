import numpy as np
import pandas as pd
from scipy.special import softmax

np.random.seed(42)

n = 40000

# ==========================================
# Base Clinical Probabilities
# ==========================================

heart_prob = np.random.beta(2.3, 3.7, n)
diabetes_prob = np.random.beta(2.3, 3.7, n)
stroke_prob = np.random.beta(2.4, 3.6, n)

# ==========================================
# Signal Probabilities
# ==========================================

ecg_prob = np.random.beta(2.3, 3.2, n)
eeg_prob = np.random.beta(2.3, 3.2, n)
emg_prob = np.random.beta(2.4, 3.0, n)

# ==========================================
# Static Risk
# ==========================================

static_risk = (
    0.25 * heart_prob +
    0.25 * diabetes_prob +
    0.20 * stroke_prob +
    0.15 * ecg_prob +
    0.15 * eeg_prob
)

# ==========================================
# Engineered Features
# ==========================================

cardio_combined = (heart_prob + ecg_prob) / 2
neuro_combined = (stroke_prob + eeg_prob + emg_prob) / 3
metabolic_combined = (diabetes_prob + static_risk) / 2
fatigue_index = (emg_prob + eeg_prob) / 2

ncm_index = (
    0.22 * heart_prob +
    0.22 * diabetes_prob +
    0.20 * stroke_prob +
    0.14 * ecg_prob +
    0.12 * eeg_prob +
    0.10 * static_risk
) * 100

# ==========================================
# BALANCED NORMALIZED SCORING
# (No artificial multiplier explosion)
# ==========================================

score_chd = cardio_combined
score_stroke = stroke_prob
score_diabetes = diabetes_prob
score_hypertension = static_risk
score_arrhythmia = ecg_prob
score_metabolic = metabolic_combined
score_neuro = neuro_combined
score_epilepsy = (eeg_prob + emg_prob) / 2
score_healthy = 1 - static_risk

scores = np.vstack([
    score_chd,          # 0
    score_stroke,       # 1
    score_diabetes,     # 2
    score_hypertension, # 3
    score_arrhythmia,   # 4
    score_metabolic,    # 5
    score_neuro,        # 6
    score_epilepsy,     # 7
    score_healthy       # 8
]).T

# ==========================================
# STRUCTURED DOMINANCE WITH CONTROLLED OVERLAP
# ==========================================

disease = []

for row in scores:

    sorted_indices = np.argsort(row)[::-1]
    top_class = sorted_indices[0]
    second_class = sorted_indices[1]

    margin = row[top_class] - row[second_class]

    # Strong dominance → deterministic
    if margin > 0.07:
        label = top_class
    else:
        # Borderline → probabilistic between top 2
        probs = softmax(row[sorted_indices[:2]] * 2)
        label = np.random.choice(
            sorted_indices[:2],
            p=probs
        )

    # Small structured noise (5%)
    if np.random.rand() < 0.05:
        label = np.random.randint(0, 9)

    disease.append(label)

# ==========================================
# Build Dataset
# ==========================================

df = pd.DataFrame({
    "heart_prob": heart_prob,
    "diabetes_prob": diabetes_prob,
    "stroke_prob": stroke_prob,
    "ecg_prob": ecg_prob,
    "eeg_prob": eeg_prob,
    "emg_prob": emg_prob,
    "static_risk": static_risk,
    "ncm_index": ncm_index,
    "cardio_combined": cardio_combined,
    "neuro_combined": neuro_combined,
    "metabolic_combined": metabolic_combined,
    "fatigue_index": fatigue_index,
    "Disease_Class": disease
})

df.to_csv("meta_dataset_realistic_balanced.csv", index=False)

print("Balanced realistic meta dataset generated!")
print("\nClass Distribution:")
print(df["Disease_Class"].value_counts(normalize=True))