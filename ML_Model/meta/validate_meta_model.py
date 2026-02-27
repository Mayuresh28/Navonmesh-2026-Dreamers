import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

# ==============================
# Load Dataset
# ==============================

df = pd.read_csv("meta_dataset_30k.csv")

X = df.drop("Disease_Class", axis=1)
y = df["Disease_Class"]

# Encode labels (CRITICAL FIX)
le = LabelEncoder()
y = le.fit_transform(y)

num_classes = len(np.unique(y))

# ==============================
# 5-Fold Cross Validation
# ==============================

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

scores = []

for fold, (train_index, test_index) in enumerate(skf.split(X, y), 1):

    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y[train_index], y[test_index]

    model = XGBClassifier(
        n_estimators=600,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="multi:softprob",
        num_class=num_classes,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    scores.append(acc)

    print(f"Fold {fold} Accuracy: {round(acc,4)}")

print("\nMean Accuracy:", round(np.mean(scores),4))
print("Std Dev:", round(np.std(scores),4))