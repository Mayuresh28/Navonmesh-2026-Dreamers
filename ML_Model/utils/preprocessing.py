def preprocess_heart(df):
    # Derived medical features
    df["PulsePressure"] = df["BP"] - 80
    df["ActivityScore"] = df["Steps"] / 1000
    df["SleepDeficit"] = 8 - df["Sleep"]

    df["CardioStressIndex"] = (
        0.02 * df["BP"] +
        0.02 * df["HeartRate"] +
        0.01 * df["Glucose"] -
        0.04 * df["Sleep"]
    )

    return df

def preprocessing_stroke(df):

    df["PulsePressure"] = df["BP"] - 80
    df["ActivityScore"] = df["Steps"] / 1000
    df["OxygenDeficit"] = 98 - df["SpO2"]

    df["StrokeRiskIndex"] = (
        0.04 * df["BP"] +
        0.03 * df["Glucose"] -
        0.2 * df["SpO2"]
    )

    return df