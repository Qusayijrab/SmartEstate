# Training pipelines

This folder contains everything needed to reproduce the three model artifacts that the FastAPI service in `backend/` serves at `/api/ai/*`. The college can follow the data-to-API path end to end:

```
training/data/*.csv  --(train_*.py)-->  models/*.{pkl,joblib}  --(ai/*.py)-->  routes/*.py  --(uvicorn)-->  /api/ai/*
```

## Layout

```
training/
├── README.md                   (this file)
├── data/
│   ├── loans_synthetic_100k.csv          ~5.1 MB, 100k rows
│   ├── amman_synthetic_prices.csv        ~313 KB, 3500 rows
│   └── synthetic_land_data.csv           ~930 KB, 7000 rows
├── generate_land_data.py       Regenerates synthetic_land_data.csv
├── train_loan.py               Trains models/loans_model.pkl
├── train_property.py           Trains models/amman_estimator.joblib
└── train_land.py               Trains models/land_value_pipeline.joblib
```

Each `train_*.py` writes both the model artifact AND a `*.meta.json` next to it (sklearn version, feature columns, dataset row counts, metrics).

## Run

From `backend/` with the venv active:

```bash
# Loan classifier (~30 s on a laptop, 100k rows × 300 trees)
python -m training.train_loan

# Apartment / house regressor (~3 s, 3500 rows)
python -m training.train_property

# Land regressor (~3 s, 7000 rows)
python -m training.train_land
```

Regenerate the land dataset from scratch (the script is fully deterministic with `random_state=42`):

```bash
python -m training.generate_land_data
python -m training.train_land
```

After any retrain, run the inference smoke tests to confirm the API still produces expected outputs:

```bash
pytest -q
```

## Models produced

| Script | Output | Algorithm | Reported metrics (synthetic data) |
| --- | --- | --- | --- |
| `train_loan.py` | `models/loans_model.pkl` | RandomForestClassifier (300 trees) | ROC AUC ~0.95+ |
| `train_property.py` | `models/amman_estimator.joblib` | Pipeline(ColumnTransformer -> RandomForestRegressor 320 trees) | MAE ~13k JOD, R² ~0.92 |
| `train_land.py` | `models/land_value_pipeline.joblib` | Pipeline(ColumnTransformer -> RandomForestRegressor 260 trees) | MAE ~83k JOD, R² ~0.91 |

The reported numbers are on synthetic data; real-market accuracy requires real listings/transaction data with the same schema.

## Datasets

All three datasets are synthetic so they're safe to commit alongside the code.

- **`loans_synthetic_100k.csv`** — 100k loan applications with the columns used by the model: `no_of_dependents, education, self_employed, income_annum, loan_amount, loan_term, cibil_score, loan_status` (and a few extras the model ignores).
- **`amman_synthetic_prices.csv`** — 3500 Amman apartments / houses with `area, bedrooms, bathrooms, floor, building_age, latitude, longitude, condition_score, city, district, neighborhood, property_type, furnished, price_jod`.
- **`synthetic_land_data.csv`** — 7000 land plots produced by `generate_land_data.py`, with district-anchored, guard-railed price-per-sqm bands so the model can't learn an unrealistic free-floating range.

## Determinism

Every script fixes `random_state` (7 for loans, 42 for property and land) so reruns produce identical models bit-for-bit on the same scikit-learn version.
