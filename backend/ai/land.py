"""Land valuation + fairness label + recommendation text.

Lifted with minimal changes from
`archive/smartestate_land_ai_realistic/landai_realistic/src/`:
- ``predict_land.py`` (input normalisation + predict_land)
- ``recommendation_engine.py`` (classify_fairness + build_recommendation)

Trained pipeline columns (per train_land_model.py):
    district, area_name, land_area_sqm, land_type, street_width_m,
    main_road_access, near_services, zoning_category, zoning_score,
    development_level, corner_plot, shape_regular, slope_level, lat, lng
"""

from functools import lru_cache
from typing import Any

import joblib
import pandas as pd

from config import MODEL_DIR


MODEL_PATH = MODEL_DIR / "land_value_pipeline.joblib"

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

DISTRICT_COORD_DEFAULTS: dict[str, tuple[float, float]] = {
    "Abdoun": (31.9450, 35.8790),
    "Dabouq": (31.9920, 35.8310),
    "Um Uthaina": (31.9660, 35.8780),
    "Jabal Amman": (31.9500, 35.9160),
    "Deir Ghbar": (31.9340, 35.8450),
    "Shmeisani": (31.9665, 35.8855),
    "Khalda": (32.0250, 35.8480),
    "Tla Al Ali": (32.0090, 35.8660),
    "Al Jubeiha": (32.0320, 35.8690),
    "Sweileh": (32.0250, 35.8570),
    "Marj Al Hamam": (31.8860, 35.7930),
    "Tabarbour": (31.9950, 35.9300),
    "Marka": (31.9950, 35.9500),
    "Sahab": (31.8690, 36.0050),
    "Naour": (31.8690, 35.7610),
}

DEFAULTS: dict[str, Any] = {
    "area_name": "Unknown Area",
    "main_road_access": 0,
    "near_services": 0,
    "corner_plot": 0,
    "shape_regular": 1,
    "slope_level": "flat",
}

FAIRNESS_TOLERANCE = 0.10


@lru_cache(maxsize=1)
def _model():
    return joblib.load(MODEL_PATH)


def list_districts() -> list[str]:
    return sorted(DISTRICT_COORD_DEFAULTS.keys())


def _normalize_input(payload: dict[str, Any]) -> dict[str, Any]:
    data = DEFAULTS.copy()
    data.update(payload)

    district = str(data["district"])
    lat_default, lng_default = DISTRICT_COORD_DEFAULTS.get(district, (31.95, 35.91))
    lat_val = lat_default if data.get("lat") in (None, "") else float(data["lat"])
    lng_val = lng_default if data.get("lng") in (None, "") else float(data["lng"])

    cleaned = {
        "district": district,
        "area_name": str(data.get("area_name", "Unknown Area")),
        "land_area_sqm": float(data["land_area_sqm"]),
        "land_type": str(data["land_type"]).lower(),
        "street_width_m": float(data["street_width_m"]),
        "main_road_access": int(bool(data["main_road_access"])),
        "near_services": int(bool(data["near_services"])),
        "zoning_category": str(data["zoning_category"]),
        "zoning_score": float(data["zoning_score"]),
        "development_level": str(data["development_level"]).lower(),
        "corner_plot": int(bool(data.get("corner_plot", 0))),
        "shape_regular": int(bool(data.get("shape_regular", 1))),
        "slope_level": str(data.get("slope_level", "flat")).lower(),
        "lat": lat_val,
        "lng": lng_val,
    }
    cleaned["asking_price_jod"] = (
        None if data.get("asking_price_jod") in (None, "") else float(data["asking_price_jod"])
    )
    return cleaned


def classify_fairness(
    predicted_value_jod: float,
    asking_price_jod: float | None,
    tolerance: float = FAIRNESS_TOLERANCE,
) -> dict:
    if asking_price_jod is None:
        return {
            "fairnessLabel": "N/A",
            "priceRatio": None,
            "differenceJod": None,
            "differencePct": None,
        }

    ratio = asking_price_jod / max(predicted_value_jod, 1.0)
    difference = asking_price_jod - predicted_value_jod
    difference_pct = (difference / max(predicted_value_jod, 1.0)) * 100.0

    if ratio < 1.0 - tolerance:
        label = "Underpriced"
    elif ratio > 1.0 + tolerance:
        label = "Overpriced"
    else:
        label = "Fair Price"

    return {
        "fairnessLabel": label,
        "priceRatio": round(ratio, 4),
        "differenceJod": round(difference, 2),
        "differencePct": round(difference_pct, 2),
    }


def build_recommendation(input_data: dict, fairness_info: dict) -> str:
    parts: list[str] = []
    fairness = fairness_info["fairnessLabel"]

    if fairness == "Underpriced":
        parts.append(
            "The asking price appears below the model's estimated market value, "
            "which may indicate a promising buying opportunity."
        )
    elif fairness == "Overpriced":
        parts.append(
            "The asking price appears above the model's estimated market value, "
            "so negotiation or a closer legal/planning review is recommended."
        )
    elif fairness == "Fair Price":
        parts.append(
            "The asking price is within a reasonable range of the model's estimated market value."
        )
    else:
        parts.append(
            "No asking price was provided, so the result focuses on the estimated market value only."
        )

    if input_data.get("main_road_access"):
        parts.append(
            "Main road access supports stronger visibility and accessibility, "
            "which positively affects land value."
        )
    if input_data.get("near_services"):
        parts.append("Proximity to services adds practical demand support for the site.")

    development_level = input_data.get("development_level")
    if development_level == "prime":
        parts.append(
            "The surrounding area is highly developed, which strengthens resale and investment appeal."
        )
    elif development_level == "low":
        parts.append(
            "Lower surrounding development may limit immediate demand, "
            "but it could still offer long-term upside."
        )

    zoning = str(input_data.get("zoning_category", "")).lower()
    land_type = str(input_data.get("land_type", "")).lower()
    if "commercial" in zoning or land_type == "commercial":
        parts.append(
            "Commercial suitability can justify a stronger price level when supported by traffic and access."
        )
    elif land_type == "agricultural":
        parts.append(
            "Agricultural land should be reviewed carefully for permitted uses, utilities, "
            "and long-term conversion potential."
        )

    if float(input_data.get("street_width_m", 0)) >= 16:
        parts.append(
            "The wider street frontage is a positive signal for accessibility and future usability."
        )

    return " ".join(parts)


def predict_land(payload: dict[str, Any]) -> dict[str, Any]:
    data = _normalize_input(payload)
    frame = pd.DataFrame([{col: data[col] for col in FEATURE_COLUMNS}])

    predicted_value_jod = float(_model().predict(frame)[0])
    price_per_sqm_jod = predicted_value_jod / max(data["land_area_sqm"], 1.0)

    fairness_info = classify_fairness(predicted_value_jod, data.get("asking_price_jod"))
    recommendation = build_recommendation(data, fairness_info)

    return {
        "predictedLandValueJod": round(predicted_value_jod, 2),
        "predictedPricePerSqmJod": round(price_per_sqm_jod, 2),
        "fairnessLabel": fairness_info["fairnessLabel"],
        "priceRatio": fairness_info["priceRatio"],
        "differenceJod": fairness_info["differenceJod"],
        "differencePct": fairness_info["differencePct"],
        "recommendationText": recommendation,
        "inputUsed": data,
    }
