import pandas as pd
import numpy as np

print("\n========== EMG DATA INSPECTION ==========\n")

df = pd.read_csv("../data/data/emg_synthetic_10k.csv")

print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())

print("\nMissing Values:\n", df.isnull().sum())

print("\nClass Distribution:")
print(df["EMG_Abnormal"].value_counts(normalize=True))

print("\nFeature Statistics:")
print(df.describe())

print("\nPercentiles:")
print(df.quantile([0.01, 0.05, 0.5, 0.95, 0.99]))

print("\nCorrelation Matrix:")
print(df.corr())

print("\n========== END EMG INSPECTION ==========\n")