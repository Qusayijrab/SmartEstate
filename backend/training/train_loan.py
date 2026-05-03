"""Train the loan-approval RandomForestClassifier.

Reads:  training/data/loans_synthetic_100k.csv
Writes: models/loans_model.pkl
        models/loans_model.meta.json

Run from the backend root:

    python -m training.train_loan
    # or:
    python training/train_loan.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import sklearn
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "training" / "data" / "loans_synthetic_100k.csv"
MODEL_PATH = BASE_DIR / "models" / "loans_model.pkl"
META_PATH = BASE_DIR / "models" / "loans_model.meta.json"

FEATURE_COLUMNS = [
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
]
TARGET_COLUMN = "loan_status"
RANDOM_STATE = 7


def load_dataset(csv_path: Path) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Loan dataset not found at {csv_path}. "
            "Make sure training/data/loans_synthetic_100k.csv is in place."
        )

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    df["education"] = (df["education"].str.lower() == "graduate").astype(int)
    df["self_employed"] = (df["self_employed"].str.lower() == "yes").astype(int)
    df["loan_status_bin"] = (df[TARGET_COLUMN].str.lower() == "approved").astype(int)

    return df


def build_classifier() -> RandomForestClassifier:
    return RandomForestClassifier(
        n_estimators=300,
        min_samples_split=4,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )


def main() -> None:
    print(f"[loan] sklearn={sklearn.__version__}")
    df = load_dataset(DATA_PATH)

    # Pass numpy arrays (not a DataFrame) so the fitted estimator records no
    # feature names; this matches the inference layer in ai/loan.py and avoids
    # "X has feature names but RandomForestClassifier was fitted without"
    # warnings at predict time.
    X = df[FEATURE_COLUMNS].values
    y = df["loan_status_bin"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    model = build_classifier()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    report_text = classification_report(y_test, y_pred, output_dict=False)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    auc = float(roc_auc_score(y_test, y_prob))

    print("[loan] classification report:")
    print(report_text)
    print(f"[loan] ROC AUC = {auc:.4f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    meta = {
        "model_type": "RandomForestClassifier",
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "n_estimators": 300,
        "random_state": RANDOM_STATE,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "roc_auc": round(auc, 4),
        "accuracy": round(float(report_dict["accuracy"]), 4),
        "macro_f1": round(float(report_dict["macro avg"]["f1-score"]), 4),
        "sklearn_version": sklearn.__version__,
        "source_dataset": DATA_PATH.name,
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"[loan] saved -> {MODEL_PATH}")
    print(f"[loan] meta  -> {META_PATH}")


if __name__ == "__main__":
    sys.exit(main() or 0)
