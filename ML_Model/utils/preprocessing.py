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

    # Return only the expected features for heart model
    return df[["BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps", 
               "PulsePressure", "ActivityScore", "SleepDeficit", "CardioStressIndex"]]

def preprocessing_stroke(df):

    df["PulsePressure"] = df["BP"] - 80
    df["ActivityScore"] = df["Steps"] / 1000
    df["OxygenDeficit"] = 98 - df["SpO2"]

    df["StrokeRiskIndex"] = (
        0.04 * df["BP"] +
        0.03 * df["Glucose"] -
        0.2 * df["SpO2"]
    )

    # Return only the expected features for stroke model
    return df[["BP", "HeartRate", "Glucose", "SpO2", "Sleep", "Steps", 
               "PulsePressure", "ActivityScore", "OxygenDeficit", "StrokeRiskIndex"]]

def preprocess_ecg(df):
    """Extract ECG features from heart rate data"""
    # ECG uses heart_rate and hrv_sdnn
    df["heart_rate"] = df["HeartRate"]
    df["hrv_sdnn"] = df.get("hrv_sdnn", 50.0)  # Default if not provided
    
    return df[["heart_rate", "hrv_sdnn"]]

def preprocess_eeg(df):
    """Extract EEG features from stress and sleep data"""
    # EEG uses stress_ratio and sleep_hours
    df["stress_ratio"] = df.get("stress_ratio", 0.5)  # Default if not provided
    df["sleep_hours"] = df["Sleep"]
    
    return df[["stress_ratio", "sleep_hours"]]

def preprocess_emg(df):
    """Extract EMG features from activity data"""
    # EMG uses emg_rms and activity_level
    df["emg_rms"] = df.get("emg_rms", 0.5)  # Default if not provided
    df["activity_level"] = df["Steps"] / 10000  # Normalize steps to 0-1 range
    
    return df[["emg_rms", "activity_level"]]