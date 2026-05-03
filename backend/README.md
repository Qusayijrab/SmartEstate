# SmartEstate AI Backend

Inference-only FastAPI service. Hosts the three trained models for the project, with the **full data → training → serving** pipeline in one place so the project can be inspected end to end:

```
training/data/*.csv
        |
        |  python -m training.train_*
        v
   models/*.{pkl,joblib}  +  *.meta.json
        |
        |  joblib.load(...)
        v
   ai/{loan,property,land}.py   (pure inference)
        |
        |
        v
   routes/*.py + schemas/*.py   (FastAPI)
        |
        |  uvicorn app:app
        v
   POST /api/ai/loan
   POST /api/ai/property        (multipart, accepts up to 20 photos)
   POST /api/ai/land
   GET  /api/ai/property/districts
   GET  /api/ai/land/districts
   GET  /api/health
```

Everything else (auth, listings, favorites, dashboards, image storage) lives in the Next.js backend, not here.

## Layout

```
backend/
├── app.py            FastAPI app, CORS, router includes
├── config.py         Settings + .env loader
├── ai/               Pure inference logic, no web framework
│   ├── loan.py       BANKS_CONFIG, EMI rule, CIBIL gate, model.predict
│   ├── property.py   Photo scoring + ML predict + rule-based fallback
│   └── land.py       Predict + fairness label + recommendation text
├── routes/           Thin FastAPI routers
├── schemas/          Pydantic request/response models (snake_case <-> camelCase)
├── models/           Trained artifacts + *.meta.json
├── training/         Data + training scripts (see training/README.md)
└── tests/            FastAPI TestClient smoke tests
```

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train (optional)

The repo ships pre-trained artifacts in `models/`, so the API works out of the box. To regenerate them from the source datasets:

```bash
# loan classifier (~30 s)
python -m training.train_loan
# property regressor (~3 s)
python -m training.train_property
# land regressor (~3 s; regenerate the dataset first if you want)
python -m training.generate_land_data
python -m training.train_land
```

See `[training/README.md](training/README.md)` for details on each pipeline, the datasets, and the metrics each script reports.

## Serve

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 5000
```

- Health: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)
- Swagger / OpenAPI: [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs)

## Tests

```bash
pytest
```

13 smoke tests covering health + every endpoint's happy and error paths.

## Environment

Copy `.env.example` to `.env` to override `CORS_ORIGINS`. Defaults allow `http://localhost:3000` and `http://127.0.0.1:3000` (Next.js dev).

## Models in `models/`


| File                         | Trainer                      | Algorithm                                                     | Metrics (synthetic)      |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------- | ------------------------ |
| `loans_model.pkl`            | `training/train_loan.py`     | RandomForestClassifier (300 trees)                            | ROC AUC ~0.999           |
| `amman_estimator.joblib`     | `training/train_property.py` | Pipeline(ColumnTransformer → RandomForestRegressor 320 trees) | MAE 12,952 JOD, R² 0.920 |
| `amman_price_priors.json`    | hand-curated district priors | —                                                             | —                        |
| `land_value_pipeline.joblib` | `training/train_land.py`     | Pipeline(ColumnTransformer → RandomForestRegressor 260 trees) | MAE 83,260 JOD, R² 0.914 |


Each `.joblib` / `.pkl` has a `*.meta.json` next to it with the exact feature columns, hyperparameters, dataset row counts, sklearn version, and source dataset name. `requirements.txt` pins `scikit-learn>=1.8,<1.9`.