from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load model and scaler
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(MODEL_DIR, "static_risk_model (1).pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

# Risk class labels (from notebook: Low, Within Range, High)
CLASS_LABELS = list(model.classes_)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        bmi = float(data["BMI"])
        genetic_risk = float(data["Genetic_Risk"])
        age_risk_multiplier = float(data["Age_Risk_Multiplier"])
        baseline_risk = float(data["Baseline_Risk"])

        # Compute engineered features (same as notebook)
        composite_risk = (
            bmi * 0.3
            + genetic_risk * 0.3
            + age_risk_multiplier * 0.2
            + baseline_risk * 0.2
        )
        bmi_genetic = bmi * genetic_risk
        age_baseline = age_risk_multiplier * baseline_risk

        # Build feature vector: 7 features
        features = np.array([[
            bmi,
            genetic_risk,
            age_risk_multiplier,
            baseline_risk,
            composite_risk,
            bmi_genetic,
            age_baseline,
        ]])

        # Scale and predict
        features_scaled = scaler.transform(features)
        probabilities = model.predict_proba(features_scaled)[0]
        predicted_class = model.predict(features_scaled)[0]

        # Build probability map
        prob_map = {}
        for label, prob in zip(CLASS_LABELS, probabilities):
            prob_map[label] = round(float(prob) * 100, 2)

        return jsonify({
            "predicted_class": str(predicted_class),
            "probabilities": prob_map,
            "input_features": {
                "BMI": bmi,
                "Genetic_Risk": genetic_risk,
                "Age_Risk_Multiplier": age_risk_multiplier,
                "Baseline_Risk": baseline_risk,
            },
            "engineered_features": {
                "Composite_Risk": round(composite_risk, 4),
                "BMI_Genetic": round(bmi_genetic, 4),
                "Age_Baseline": round(age_baseline, 4),
            },
        })

    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_classes": CLASS_LABELS})


if __name__ == "__main__":
    print(f"Model classes: {CLASS_LABELS}")
    print("Starting Flask server on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
