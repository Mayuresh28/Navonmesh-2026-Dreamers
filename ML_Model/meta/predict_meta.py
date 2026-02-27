import joblib
import numpy as np

# ==============================
# Load Saved Meta Model
# ==============================

model_data = joblib.load("meta_model.pkl")

model = model_data["model"]
label_encoder = model_data["label_encoder"]

# ==============================
# Disease Label Mapping
# ==============================

# ==============================
# Disease Label Mapping (UPDATED)
# ==============================

disease_names = {
    0: "Coronary Heart Disease",
    1: "Stroke",
    2: "Diabetes",
    3: "Hypertension",
    4: "Arrhythmia",
    11: "Metabolic Syndrome",
    12: "Neurological Disorder"
}

# ==============================
# INPUT SECTION (EDIT HERE)
# ==============================

sample_input = {
    "heart_prob": 0.60,
    "diabetes_prob": 0.65,
    "stroke_prob": 0.58,
    "ecg_prob": 0.55,
    "eeg_prob": 0.52,
    "emg_prob": 0.50,
    "static_risk": 0.63,
    "ncm_index": 69,
    "cardio_combined": 0.57,
    "neuro_combined": 0.55,
    "metabolic_combined": 0.64,
    "fatigue_index": 0.51
}

# ==============================
# Convert Input to Model Format
# ==============================

input_array = np.array([list(sample_input.values())])

# Predict probabilities
probabilities = model.predict_proba(input_array)[0]

# Get predicted class
predicted_encoded = model.predict(input_array)[0]

# Decode original label
predicted_original = label_encoder.inverse_transform([predicted_encoded])[0]

# Map to disease name
predicted_disease = disease_names.get(predicted_original, "Unknown Disease")

# ==============================
# OUTPUT
# ==============================

print("\n===== META MODEL PREDICTION =====")
print("Predicted Disease:", predicted_disease)
print("Confidence:", round(np.max(probabilities), 4))
print("\nFull Probability Distribution:")

for i, prob in enumerate(probabilities):
    original_label = label_encoder.inverse_transform([i])[0]
    name = disease_names.get(original_label, "Unknown")
    print(f"{name}: {round(prob,4)}")