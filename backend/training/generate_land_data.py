"""Regenerate the synthetic land-valuation dataset.

Reads:  nothing
Writes: training/data/synthetic_land_data.csv
        training/data/dataset_schema_land.json

The data is district-anchored Jordan/Amman pricing with guarded
price-per-sqm bands so a stack of positive features can't push the price
into a free-floating range. Lifted from
``archive/smartestate_land_ai_realistic/landai_realistic/src/generate_land_data.py``
with no behavioural changes; only paths and prints were tidied.

Run from the backend root:

    python -m training.generate_land_data
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "training" / "data"
CSV_PATH = DATA_DIR / "synthetic_land_data.csv"
SCHEMA_PATH = DATA_DIR / "dataset_schema_land.json"

DEFAULT_ROW_COUNT = 7000
RANDOM_STATE = 42


DISTRICT_PROFILES: dict[str, dict] = {
    "Abdoun":        {"areas": ["North Abdoun", "South Abdoun"],            "coords": (31.9450, 35.8790), "residential": (850, 1400), "commercial": (1200, 2200), "agricultural": (180, 320), "dev_probs": [0.02, 0.08, 0.35, 0.55]},
    "Dabouq":        {"areas": ["Dabouq Villas", "Airport Road West"],      "coords": (31.9920, 35.8310), "residential": (700, 1200), "commercial": (900, 1700),  "agricultural": (160, 300), "dev_probs": [0.04, 0.14, 0.42, 0.40]},
    "Um Uthaina":    {"areas": ["Um Uthaina North", "Um Uthaina South"],    "coords": (31.9660, 35.8780), "residential": (700, 1200), "commercial": (950, 1800),  "agricultural": (150, 260), "dev_probs": [0.03, 0.15, 0.47, 0.35]},
    "Jabal Amman":   {"areas": ["1st Circle", "4th Circle"],                "coords": (31.9500, 35.9160), "residential": (700, 1350), "commercial": (1000, 2000), "agricultural": (120, 220), "dev_probs": [0.02, 0.10, 0.43, 0.45]},
    "Deir Ghbar":    {"areas": ["Deir Ghbar Heights", "Deir Ghbar South"],  "coords": (31.9340, 35.8450), "residential": (550, 900),  "commercial": (750, 1300),  "agricultural": (120, 220), "dev_probs": [0.05, 0.18, 0.47, 0.30]},
    "Shmeisani":     {"areas": ["Central Shmeisani", "West Shmeisani"],     "coords": (31.9665, 35.8855), "residential": (500, 850),  "commercial": (800, 1500),  "agricultural": (110, 180), "dev_probs": [0.03, 0.14, 0.48, 0.35]},
    "Khalda":        {"areas": ["Khalda North", "Khalda Circle"],           "coords": (32.0250, 35.8480), "residential": (300, 600),  "commercial": (500, 950),   "agricultural": (90, 180),  "dev_probs": [0.07, 0.24, 0.45, 0.24]},
    "Tla Al Ali":    {"areas": ["Tla Al Ali East", "Tla Al Ali West"],      "coords": (32.0090, 35.8660), "residential": (280, 520),  "commercial": (480, 900),   "agricultural": (90, 170),  "dev_probs": [0.07, 0.25, 0.45, 0.23]},
    "Al Jubeiha":    {"areas": ["Jubeiha University Side", "Jubeiha North"],"coords": (32.0320, 35.8690), "residential": (220, 420),  "commercial": (400, 780),   "agricultural": (80, 160),  "dev_probs": [0.10, 0.28, 0.42, 0.20]},
    "Sweileh":       {"areas": ["Sweileh Center", "Sweileh North"],         "coords": (32.0250, 35.8570), "residential": (220, 430),  "commercial": (400, 780),   "agricultural": (80, 160),  "dev_probs": [0.10, 0.28, 0.42, 0.20]},
    "Marj Al Hamam": {"areas": ["Marj Center", "Marj Hills"],               "coords": (31.8860, 35.7930), "residential": (160, 320),  "commercial": (260, 520),   "agricultural": (70, 130),  "dev_probs": [0.16, 0.33, 0.36, 0.15]},
    "Tabarbour":     {"areas": ["Tabarbour Main", "Inner Neighborhood"],    "coords": (31.9950, 35.9300), "residential": (170, 320),  "commercial": (300, 620),   "agricultural": (60, 120),  "dev_probs": [0.17, 0.33, 0.35, 0.15]},
    "Marka":         {"areas": ["Marka North", "Marka South"],              "coords": (31.9950, 35.9500), "residential": (140, 270),  "commercial": (260, 540),   "agricultural": (55, 110),  "dev_probs": [0.18, 0.34, 0.34, 0.14]},
    "Sahab":         {"areas": ["Sahab Industrial Edge", "Sahab Center"],   "coords": (31.8690, 36.0050), "residential": (90, 180),   "commercial": (180, 360),   "agricultural": (45, 90),   "dev_probs": [0.25, 0.34, 0.29, 0.12]},
    "Naour":         {"areas": ["Naour Center", "Naour West"],              "coords": (31.8690, 35.7610), "residential": (100, 210),  "commercial": (190, 380),   "agricultural": (50, 100),  "dev_probs": [0.24, 0.34, 0.30, 0.12]},
}

LAND_TYPES = ["residential", "commercial", "agricultural"]
LAND_TYPE_PROBS = [0.64, 0.23, 0.13]
DEVELOPMENT_LEVELS = ["low", "medium", "high", "prime"]
SLOPE_LEVELS = ["flat", "moderate", "steep"]
SLOPE_MULTIPLIER = {"flat": 1.00, "moderate": 0.93, "steep": 0.82}
ZONING_SCORE_MAP = {
    "A": 9, "B": 8, "C": 6, "D": 5,
    "commercial_local": 8, "commercial_general": 10, "agricultural": 3,
}


def choose_zoning(land_type: str, rng: np.random.Generator) -> str:
    if land_type == "residential":
        return rng.choice(["A", "B", "C", "D"], p=[0.16, 0.28, 0.34, 0.22])
    if land_type == "commercial":
        return rng.choice(["commercial_local", "commercial_general"], p=[0.62, 0.38])
    return "agricultural"


def classify_fairness(predicted_value: float, asking_price: float) -> str:
    ratio = asking_price / max(predicted_value, 1.0)
    if ratio < 0.90:
        return "Underpriced"
    if ratio > 1.10:
        return "Overpriced"
    return "Fair Price"


def sample_land_area(land_type: str, rng: np.random.Generator) -> float:
    if land_type == "residential":
        return float(np.clip(rng.normal(720, 230), 250, 1800))
    if land_type == "commercial":
        return float(np.clip(rng.normal(820, 280), 250, 2500))
    return float(np.clip(rng.normal(2400, 1200), 800, 9000))


def calc_area_discount(land_area_sqm: float, land_type: str) -> float:
    if land_type == "residential":
        if land_area_sqm <= 1000:
            return 1.0
        return max(0.88, 1.0 - (land_area_sqm - 1000) / 8000)
    if land_type == "commercial":
        if land_area_sqm <= 900:
            return 1.0
        return max(0.90, 1.0 - (land_area_sqm - 900) / 9000)
    if land_area_sqm <= 3000:
        return 1.0
    return max(0.85, 1.0 - (land_area_sqm - 3000) / 18000)


def create_record(rng: np.random.Generator) -> dict:
    district = rng.choice(list(DISTRICT_PROFILES.keys()))
    profile = DISTRICT_PROFILES[district]
    area_name = rng.choice(profile["areas"])
    land_type = rng.choice(LAND_TYPES, p=LAND_TYPE_PROBS)

    land_area_sqm = sample_land_area(land_type, rng)
    street_width_m = float(
        rng.choice(
            [6, 8, 10, 12, 14, 16, 20, 24, 30],
            p=[0.08, 0.12, 0.12, 0.20, 0.10, 0.18, 0.12, 0.06, 0.02],
        )
    )
    main_road_access = int(rng.random() < (0.62 if land_type == "commercial" else 0.26))
    near_services = int(rng.random() < (0.78 if land_type != "agricultural" else 0.30))
    zoning_category = choose_zoning(land_type, rng)
    zoning_score = ZONING_SCORE_MAP[zoning_category]
    development_level = rng.choice(DEVELOPMENT_LEVELS, p=profile["dev_probs"])
    corner_plot = int(rng.random() < 0.24)
    shape_regular = int(rng.random() < 0.74)
    slope_level = rng.choice(SLOPE_LEVELS, p=[0.52, 0.34, 0.14])

    lat0, lng0 = profile["coords"]
    lat = lat0 + rng.normal(0, 0.0045)
    lng = lng0 + rng.normal(0, 0.0055)

    low_base, high_base = profile[land_type]
    base_psm = rng.uniform(low_base, high_base)

    if land_type == "residential":
        zoning_mult = {"A": 1.08, "B": 1.03, "C": 0.97, "D": 0.92}[zoning_category]
    elif land_type == "commercial":
        zoning_mult = {"commercial_local": 0.98, "commercial_general": 1.10}[zoning_category]
    else:
        zoning_mult = 0.95

    development_mult = {"low": 0.90, "medium": 0.98, "high": 1.06, "prime": 1.12}[development_level]
    street_mult = 1.0 + min(max(street_width_m - 8, 0), 16) * 0.009
    road_mult = 1.12 if main_road_access else 1.0
    services_mult = 1.08 if near_services else 0.95
    corner_mult = 1.06 if corner_plot else 1.0
    shape_mult = 1.02 if shape_regular else 0.95
    slope_mult = SLOPE_MULTIPLIER[slope_level]
    area_mult = calc_area_discount(land_area_sqm, land_type)
    noise_mult = rng.normal(1.0, 0.05)

    price_per_sqm_jod = (
        base_psm * zoning_mult * development_mult * street_mult * road_mult
        * services_mult * corner_mult * shape_mult * slope_mult * area_mult * noise_mult
    )

    # Hard guards so districts stay realistic even with stacked positives.
    min_guard = low_base * (0.72 if land_type == "agricultural" else 0.80)
    max_guard = high_base * (1.15 if land_type == "commercial" else 1.10)
    price_per_sqm_jod = float(np.clip(price_per_sqm_jod, min_guard, max_guard))

    estimated_market_value_jod = price_per_sqm_jod * land_area_sqm
    asking_price_jod = max(10000.0, estimated_market_value_jod * rng.normal(1.0, 0.12))
    fairness_label = classify_fairness(estimated_market_value_jod, asking_price_jod)

    return {
        "district": district,
        "area_name": area_name,
        "land_area_sqm": round(land_area_sqm, 2),
        "land_type": land_type,
        "street_width_m": street_width_m,
        "main_road_access": main_road_access,
        "near_services": near_services,
        "zoning_category": zoning_category,
        "zoning_score": zoning_score,
        "development_level": development_level,
        "corner_plot": corner_plot,
        "shape_regular": shape_regular,
        "slope_level": slope_level,
        "lat": round(float(lat), 6),
        "lng": round(float(lng), 6),
        "asking_price_jod": round(float(asking_price_jod), 2),
        "price_per_sqm_jod": round(float(price_per_sqm_jod), 2),
        "estimated_market_value_jod": round(float(estimated_market_value_jod), 2),
        "fairness_label": fairness_label,
    }


def generate_dataset(n_rows: int = DEFAULT_ROW_COUNT, random_state: int = RANDOM_STATE) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    return pd.DataFrame(create_record(rng) for _ in range(n_rows))


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    df = generate_dataset()
    df.to_csv(CSV_PATH, index=False)

    schema = {
        "features": [
            "district", "area_name", "land_area_sqm", "land_type", "street_width_m",
            "main_road_access", "near_services", "zoning_category", "zoning_score",
            "development_level", "corner_plot", "shape_regular", "slope_level", "lat", "lng",
        ],
        "optional_inference_field": ["asking_price_jod"],
        "targets": ["estimated_market_value_jod"],
        "derived_columns": ["price_per_sqm_jod", "fairness_label"],
        "row_count": int(len(df)),
        "random_state": RANDOM_STATE,
        "note": "Synthetic district-anchored Jordan/Amman land valuation dataset with guarded price-per-sqm bands.",
    }
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2))

    summary = (
        df.groupby(["district", "land_type"])["price_per_sqm_jod"]
        .agg(["min", "median", "max"])
        .round(2)
    )
    print(f"[land-data] rows  -> {len(df)}")
    print(f"[land-data] saved -> {CSV_PATH}")
    print(f"[land-data] schema-> {SCHEMA_PATH}")
    print("[land-data] price/sqm summary by (district, land_type):")
    print(summary.to_string())


if __name__ == "__main__":
    main()
