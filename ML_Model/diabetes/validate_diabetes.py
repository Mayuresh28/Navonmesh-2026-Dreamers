import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier
import sys
import os

sys.path.append(os.path.abspath("../"))
from utils.preprocessing_diabetes import preprocess_diabetes

df = pd.read_csv("../data/synthetic/diabetes_synthetic_10k.csv")
df = preprocess_diabetes(df)

X = df.drop("Diabetes", axis=1)
y = df["Diabetes"]

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

auc_scores = []

for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
    X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
    y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

    scale_weight = len(y_train[y_train == 0]) / len(y_train[y_train == 1])

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_weight,
        eval_metric="logloss"
    )

    model.fit(X_train, y_train)

    y_prob = model.predict_proba(X_val)[:, 1]
    auc = roc_auc_score(y_val, y_prob)
    auc_scores.append(auc)

    print(f"Fold {fold+1} AUC:", auc)

print("\nMean AUC:", np.mean(auc_scores))
print("Std Dev:", np.std(auc_scores))