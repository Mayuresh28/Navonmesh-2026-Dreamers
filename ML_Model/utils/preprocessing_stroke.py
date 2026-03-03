import pandas as pd

def preprocess_stroke(df):
    # Must match the make_features() formulas in stroke/train_stroke.py
    df["PulsePressure"] = df["BP"] - (df["HeartRate"] * 0.5)
    df["ActivityScore"] = df["Steps"] / 10000
    df["OxygenDeficit"] = 100 - df["SpO2"]
    df["StrokeRiskIndex"] = (
        (df["BP"] / 120) * (df["Glucose"] / 100) * (1 / (df["SpO2"] / 100)) * 0.3
    )

    return df[["BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps",
               "PulsePressure", "ActivityScore", "OxygenDeficit", "StrokeRiskIndex"]]