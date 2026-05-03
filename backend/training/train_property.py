"""Train the Amman apartment / house price RandomForestRegressor pipeline.

Reads:  training/data/amman_synthetic_prices.csv
Writes: models/amman_estimator.joblib
        models/amman_estimator.meta.json

The pipeline lives entirely inside scikit-learn:
    ColumnTransformer(
        num: SimpleImputer(strategy='median'),
        cat: SimpleImputer(strategy='most_frequent') -> OneHotEncoder
    ) -> RandomForestRegressor

Run from the backend root:

    python -m training.train_property
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import joblib
import sklearn
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "training" / "data" / "amman_synthetic_prices.csv"
MODEL_PATH = BASE_DIR / "models" / "amman_estimator.joblib"
META_PATH = BASE_DIR / "models" / "amman_estimator.meta.json"

NUMERIC_COLUMNS = [
    "area",
    "bedrooms",
    "bathrooms",
    "floor",
    "building_age",
    "latitude",
    "longitude",
    "condition_score",
]
CATEGORICAL_COLUMNS = [
    "city",
    "district",
    "neighborhood",
    "property_type",
    "furnished",
]
TARGET_COLUMN = "price_jod"
RANDOM_STATE = 42


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline([("imp", SimpleImputer(strategy="median"))]),
                NUMERIC_COLUMNS,
            ),
            (
                "cat",
                Pipeline(
                    [
                        ("imp", SimpleImputer(strategy="most_frequent")),
                        ("oh", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_COLUMNS,
            ),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=320,
        max_depth=22,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline([("pre", preprocessor), ("model", model)])


def main() -> None:
    print(f"[property] sklearn={sklearn.__version__}")
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Property dataset not found at {DATA_PATH}. "
            "Make sure training/data/amman_synthetic_prices.csv is in place."
        )

    df = pd.read_csv(DATA_PATH)
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    pred = pipe.predict(X_test)
    metrics = {
        "mae_jod": round(float(mean_absolute_error(y_test, pred)), 2),
        "rmse_jod": round(float(math.sqrt(mean_squared_error(y_test, pred))), 2),
        "r2": round(float(r2_score(y_test, pred)), 4),
    }
    print(f"[property] metrics={metrics}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, MODEL_PATH)

    meta = {
        "model_type": "Pipeline(ColumnTransformer -> RandomForestRegressor)",
        "numeric_columns": NUMERIC_COLUMNS,
        "categorical_columns": CATEGORICAL_COLUMNS,
        "target_column": TARGET_COLUMN,
        "n_estimators": 320,
        "max_depth": 22,
        "random_state": RANDOM_STATE,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "n_total_rows": int(len(df)),
        "metrics": metrics,
        "sklearn_version": sklearn.__version__,
        "source_dataset": DATA_PATH.name,
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"[property] saved -> {MODEL_PATH}")
    print(f"[property] meta  -> {META_PATH}")


if __name__ == "__main__":
    sys.exit(main() or 0)
