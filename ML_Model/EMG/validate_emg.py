import pandas as pd
import numpy as np

from sklearn.model_selection import StratifiedKFold
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

print("\n========== EMG 5-FOLD VALIDATION (XGB) ==========\n")

df = pd.read_csv("../data/data/emg_synthetic_10k.csv")

X = df.drop("EMG_Abnormal", axis=1)
y = df["EMG_Abnormal"]

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

fold = 1
accuracies = []

for train_index, test_index in skf.split(X, y):

    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]

    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    scale_weight = neg / pos

    base_model = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_weight,
        eval_metric="logloss",
        use_label_encoder=False,
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
print("\n=================================================\n")