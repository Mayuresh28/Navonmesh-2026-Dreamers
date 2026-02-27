import joblib
import pandas as pd

# Load model package
package = joblib.load("heart_model.pkl")
model = package["model"]
threshold = package["threshold"]

def predict_heart_risk(input_data_dict):

    df = pd.DataFrame([input_data_dict])

    # Feature engineering (must match training)
    df["PulsePressure"] = df["BP"] - 80
    df["ActivityScore"] = df["Steps"] / 1000
    df["SleepDeficit"] = 8 - df["Sleep"]
    df["CardioStressIndex"] = (
        0.02 * df["BP"] +
        0.02 * df["HeartRate"] +
        0.01 * df["Glucose"] -
        0.04 * df["Sleep"]
    )

    prob = model.predict_proba(df)[0][1]
    prediction = int(prob > threshold)

    return {
        "probability": float(prob),
        "prediction": prediction
    }


# =============================
# 🔥 Add This Block
# =============================
if __name__ == "__main__":

    sample_input = {
        "BP": 160,
        "HeartRate": 105,
        "Glucose": 150,
        "SpO2": 93,
        "Sleep": 5,
        "Steps": 2000
    }

    result = predict_heart_risk(sample_input)

    print("\n===== HEART RISK PREDICTION =====")
    print("Probability:", result["probability"])
    print("Prediction (0=Low Risk, 1=High Risk):", result["prediction"])