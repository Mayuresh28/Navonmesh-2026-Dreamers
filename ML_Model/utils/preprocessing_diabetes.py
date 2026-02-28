def preprocess_diabetes(df):

    df["GlucoseStress"] = df["Glucose"] / 100
    df["ActivityScore"] = df["Steps"] / 1000
    df["SleepDeficit"] = 8 - df["Sleep"]
    df["MetabolicIndex"] = (
        0.05 * df["Glucose"] +
        0.02 * df["BP"] -
        0.03 * df["Sleep"]
    )

    # Return only the expected features for diabetes model
    return df[["BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps",
               "GlucoseStress", "ActivityScore", "SleepDeficit", "MetabolicIndex"]]