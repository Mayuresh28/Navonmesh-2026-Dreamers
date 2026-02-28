import pandas as pd
import numpy as np

from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score

print("\n========== EEG 5-FOLD VALIDATION ==========\n")

df = pd.read_csv("../data/data/eeg_synthetic_10k.csv")

X = df.drop("EEG_Abnormal", axis=1)
y = df["EEG_Abnormal"]

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

fold = 1
accuracies = []

for train_index, test_index in skf.split(X, y):

    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    base_model = GradientBoostingClassifier(
        n_estimators=250,
        learning_rate=0.05,
        max_depth=3,
        random_state=42
    )

    model = CalibratedClassifierCV(base_model, cv=3)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    accuracies.append(acc)

    print(f"Fold {fold} Accuracy:", round(acc, 4))
    fold += 1

print("\nMean Accuracy:", round(np.mean(accuracies), 4))
print("Std Dev:", round(np.std(accuracies), 4))
print("\n==========================================\n")