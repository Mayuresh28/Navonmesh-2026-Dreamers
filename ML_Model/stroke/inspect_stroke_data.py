import pandas as pd

# Load dataset
df = pd.read_csv("../data/synthetic/stroke_synthetic_10k.csv")

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== DATA INFO =====")
print(df.info())

print("\n===== STATISTICAL SUMMARY =====")
print(df.describe())

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== CLASS DISTRIBUTION =====")
print(df["Stroke"].value_counts())

print("\nClass Percentage:")
print(df["Stroke"].value_counts(normalize=True) * 100)