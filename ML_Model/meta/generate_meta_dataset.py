import numpy as np
import pandas as pd

np.random.seed(42)

n = 30000

# ==============================
# Simulated Base Model Outputs
# ==============================

heart_prob = np.random.beta(2, 5, n)
diabetes_prob = np.random.beta(2, 4, n)
stroke_prob = np.random.beta(2, 6, n)

ecg_prob = np.random.beta(2, 5, n)
eeg_prob = np.random.beta(2, 5, n)
emg_prob = np.random.beta(2, 5, n)

static_risk = np.random.beta(2, 3, n)
ncm_index = np.random.uniform(20, 90, n)

# ==============================
# Engineered Cross-Organ Features
# ==============================

cardio_combined = (heart_prob + ecg_prob) / 2
neuro_combined = (stroke_prob + eeg_prob) / 2
metabolic_combined = (diabetes_prob + static_risk) / 2
fatigue_index = (emg_prob + eeg_prob) / 2

# ==============================
# Deterministic Disease Scoring
# ==============================

disease = []

for i in range(n):

    disease_scores = np.array([

        cardio_combined[i],
        stroke_prob[i],
        diabetes_prob[i],
        static_risk[i],
        ecg_prob[i],
        metabolic_combined[i],
        (static_risk[i] + metabolic_combined[i]) / 2,
        eeg_prob[i],
        neuro_combined[i],
        eeg_prob[i] * 1.05,
        fatigue_index[i],
        emg_prob[i],
        eeg_prob[i] * 1.1

    ])

    disease.append(np.argmax(disease_scores))

# ==============================
# Create DataFrame
# ==============================

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

# ==============================
# BALANCE THE DATASET
# ==============================

min_samples = df["Disease_Class"].value_counts().min()

df_balanced = df.groupby("Disease_Class").apply(
    lambda x: x.sample(min_samples, random_state=42)
).reset_index(drop=True)

df_balanced.to_csv("meta_dataset_30k.csv", index=False)

print("Balanced Meta dataset generated successfully!")
print("\nClass Distribution:")
print(df_balanced["Disease_Class"].value_counts())