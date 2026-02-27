import pandas as pd

def preprocess_stroke(df):

    df["PulsePressure"] = df["BP"] - df["BP"] * 0.5
    df["ActivityScore"] = df["Steps"] / 10000
    df["OxygenDeficit"] = 100 - df["SpO2"]
    df["StrokeRiskIndex"] = (
        0.4 * df["BP"] +
        0.3 * df["HeartRate"] +
        0.3 * df["Glucose"]
    ) / 200

    return df