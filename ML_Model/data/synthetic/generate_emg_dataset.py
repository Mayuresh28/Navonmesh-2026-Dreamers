import numpy as np
import pandas as pd

np.random.seed(42)

n = 10000

emg_rms = np.random.normal(0.5, 0.2, n)
activity_level = np.random.normal(6000, 2500, n)

emg_rms = np.clip(emg_rms, 0.05, 1.5)
activity_level = np.clip(activity_level, 0, 20000)

# Stronger but realistic separation
score = (
    2.0 * (emg_rms - 0.5) -
    0.0004 * (activity_level - 6000)
)

noise = np.random.normal(0, 0.6, n)
score = score + noise

probability = 1 / (1 + np.exp(-score))

emg_abnormal = (probability > 0.60).astype(int)

df = pd.DataFrame({
    "emg_rms": emg_rms,
    "activity_level": activity_level,
    "EMG_Abnormal": emg_abnormal
})

df.to_csv("../data/emg_synthetic_10k.csv", index=False)

print("Improved EMG dataset generated!")