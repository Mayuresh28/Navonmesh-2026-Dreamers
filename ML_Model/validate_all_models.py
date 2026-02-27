import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier
import sys
import os

sys.path.append(os.path.abspath("./"))
from utils.preprocessing import (
    preprocess_heart,
    preprocessing_stroke
)

from utils.preprocessing_diabetes import preprocess_diabetes

def validate_model(data_path, label_col, preprocess_function, model_name):

    print(f"\n==============================")
    print(f"🔎 Validating {model_name}")
    print(f"==============================")

    df = pd.read_csv(data_path)
    df = preprocess_function(df)

    X = df.drop(label_col, axis=1)
    y = df[label_col]

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    auc_scores = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):

        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        # Handle imbalance dynamically
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

        print(f"Fold {fold+1} AUC: {round(auc, 4)}")

    print("\nMean AUC:", round(np.mean(auc_scores), 4))
    print("Std Dev :", round(np.std(auc_scores), 4))


# ===================================
# Validate Heart
# ===================================
validate_model(
    data_path="data/synthetic/heart_synthetic_10k.csv",
    label_col="HeartDisease",
    preprocess_function=preprocess_heart,
    model_name="Heart Model"
)

# ===================================
# Validate Diabetes
# ===================================
validate_model(
    data_path="data/synthetic/diabetes_synthetic_10k.csv",
    label_col="Diabetes",
    preprocess_function=preprocess_diabetes,
    model_name="Diabetes Model"
)

# ===================================
# Validate Stroke
# ===================================
validate_model(
    data_path="data/synthetic/stroke_synthetic_10k.csv",
    label_col="Stroke",
    preprocess_function=preprocessing_stroke,
    model_name="Stroke Model"
)