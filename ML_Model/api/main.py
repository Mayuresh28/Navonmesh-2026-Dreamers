from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import sys

# Allow importing preprocessing
sys.path.append(os.path.abspath("../"))
from utils.preprocessing import (
    preprocess_heart,
    preprocessing_stroke
)

from utils.preprocessing_diabetes import preprocess_diabetes

app = FastAPI(title="Multi-Disease Risk Prediction API")

# ===============================
# Load Models
# ===============================
heart_data = joblib.load("heart/heart_model.pkl")
diabetes_data = joblib.load("diabetes/diabetes_model.pkl")
stroke_data = joblib.load("stroke/stroke_model.pkl")

heart_model = heart_data["model"]
heart_threshold = heart_data["threshold"]

diabetes_model = diabetes_data["model"]
diabetes_threshold = diabetes_data["threshold"]

stroke_model = stroke_data["model"]
stroke_threshold = stroke_data["threshold"]

# ===============================
# Request Schema
# ===============================
class PatientInput(BaseModel):
    BP: float
    HeartRate: float
    Glucose: float
    SpO2: float
    Sleep: float
    Steps: float

# ===============================
# Prediction Endpoint
# ===============================
@app.post("/predict")
def predict(data: PatientInput):

    df = pd.DataFrame([data.dict()])

    # --------------------
    # HEART
    # --------------------
    heart_df = preprocess_heart(df.copy())
    heart_prob = heart_model.predict_proba(heart_df)[0][1]
    heart_pred = int(heart_prob > heart_threshold)

    # --------------------
    # DIABETES
    # --------------------
    diabetes_df = preprocess_diabetes(df.copy())
    diabetes_prob = diabetes_model.predict_proba(diabetes_df)[0][1]
    diabetes_pred = int(diabetes_prob > diabetes_threshold)

    # --------------------
    # STROKE
    # --------------------
    stroke_df = preprocessing_stroke(df.copy())
    stroke_prob = stroke_model.predict_proba(stroke_df)[0][1]
    stroke_pred = int(stroke_prob > stroke_threshold)

    return {
        "heart": {
            "probability": float(heart_prob),
            "risk": heart_pred
        },
        "diabetes": {
            "probability": float(diabetes_prob),
            "risk": diabetes_pred
        },
        "stroke": {
            "probability": float(stroke_prob),
            "risk": stroke_pred
        }
    }

@app.get("/")
def home():
    return {"message": "Multi-Disease Risk Prediction API Running"}