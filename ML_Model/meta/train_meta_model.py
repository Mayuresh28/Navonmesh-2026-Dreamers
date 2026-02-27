import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
import joblib

# ==============================
# Load Dataset
# ==============================

df = pd.read_csv("meta_dataset_30k.csv")

X = df.drop("Disease_Class", axis=1)
y = df["Disease_Class"]

# Encode labels safely
le = LabelEncoder()
y = le.fit_transform(y)

num_classes = len(np.unique(y))

print("\nEncoded Class Labels:", np.unique(y))

# ==============================
# Train-Test Split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ==============================
# Define Model
# ==============================

model = XGBClassifier(
    n_estimators=800,
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

model.fit(
    X_train,
    y_train,
    eval_set=[(X_test, y_test)],
    verbose=False
)

# ==============================
# Evaluation
# ==============================

y_pred = model.predict(X_test)

print("\nFinal Meta Model Accuracy:", round(accuracy_score(y_test, y_pred), 4))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Save both model + encoder
joblib.dump({
    "model": model,
    "label_encoder": le
}, "meta_model.pkl")

print("\nMeta model saved successfully!")