"""Train the land-valuation RandomForestRegressor pipeline.

Reads:  training/data/synthetic_land_data.csv
        (regenerate it with: python -m training.generate_land_data)
Writes: models/land_value_pipeline.joblib
        models/land_value_pipeline.meta.json

Run from the backend root:

    python -m training.train_land
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import sklearn
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "training" / "data" / "synthetic_land_data.csv"
MODEL_PATH = BASE_DIR / "models" / "land_value_pipeline.joblib"
META_PATH = BASE_DIR / "models" / "land_value_pipeline.meta.json"

FEATURE_COLUMNS = [
    "district",
    "area_name",
    "land_area_sqm",
    "land_type",
    "street_width_m",
    "main_road_access",
    "near_services",
    "zoning_category",
    "zoning_score",
    "development_level",
    "corner_plot",
    "shape_regular",
    "slope_level",
    "lat",
    "lng",
]
TARGET_COLUMN = "estimated_market_value_jod"
CATEGORICAL = [
    "district",
    "area_name",
    "land_type",
    "zoning_category",
    "development_level",
    "slope_level",
]
NUMERIC = [
    "land_area_sqm",
    "street_width_m",
    "main_road_access",
    "near_services",
    "zoning_score",
    "corner_plot",
    "shape_regular",
    "lat",
    "lng",
]
RANDOM_STATE = 42


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL,
            ),
            (
                "num",
                Pipeline([("imputer", SimpleImputer(strategy="median"))]),
                NUMERIC,
            ),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=260,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def main() -> None:
    print(f"[land] sklearn={sklearn.__version__}")
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Land dataset not found at {DATA_PATH}. "
            "Generate it first with: python -m training.generate_land_data"
        )

    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    metrics = {
        "mae_jod": round(float(mean_absolute_error(y_test, preds)), 2),
        "r2": round(float(r2_score(y_test, preds)), 4),
    }
    print(f"[land] metrics={metrics}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    meta = {
        "model_type": "Pipeline(ColumnTransformer -> RandomForestRegressor)",
        "feature_columns": FEATURE_COLUMNS,
        "categorical_columns": CATEGORICAL,
        "numeric_columns": NUMERIC,
        "target_column": TARGET_COLUMN,
        "n_estimators": 260,
        "max_depth": 16,
        "random_state": RANDOM_STATE,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "n_total_rows": int(len(df)),
        "metrics": metrics,
        "sklearn_version": sklearn.__version__,
        "source_dataset": DATA_PATH.name,
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"[land] saved -> {MODEL_PATH}")
    print(f"[land] meta  -> {META_PATH}")


if __name__ == "__main__":
    sys.exit(main() or 0)
