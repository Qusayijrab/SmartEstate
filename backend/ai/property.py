"""Apartment / house price estimator + photo condition scoring.

Lifted from `archive/smartestate_v3_bundle/smartestate_v3/fixed_app.py` and
fixed up:

1. The trained Pipeline expects the feature column to be ``condition_score``;
   the original Streamlit app passed ``condition_score_from_photos`` and the
   ML predict either silently failed or fell through to the rule-based path.
2. The priors JSON only ships ``base_sqm`` (price per square meter), but the
   original ``get_base_rate`` looked for ``price_per_m2`` / ``base_price_per_m2``
   and always fell back to a flat ``900``. We now read ``base_sqm`` first and
   keep the older keys as compatibility fallbacks.

Trained pipeline columns (per train_amman_estimator.py):
    numeric: area, bedrooms, bathrooms, floor, building_age,
             latitude, longitude, condition_score
    categorical: city, district, neighborhood, property_type, furnished
"""

import json
from functools import lru_cache
from io import BytesIO
from typing import Any, Iterable

import joblib
import numpy as np
import pandas as pd
from PIL import Image, ImageStat

from config import MODEL_DIR


MODEL_PATH = MODEL_DIR / "amman_estimator.joblib"
PRIORS_PATH = MODEL_DIR / "amman_price_priors.json"

MAX_IMAGES = 20
SUPPORTED_IMAGE_TYPES = {"jpg", "jpeg", "png", "webp"}

NEUTRAL_CONDITION_SCORE = 1.0
DEFAULT_BASE_RATE_PER_SQM = 900.0
PRICE_RANGE_TOLERANCE = 0.07


@lru_cache(maxsize=1)
def _model():
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def _priors() -> dict[str, dict]:
    with open(PRIORS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def list_districts() -> list[str]:
    return sorted(_priors().keys())


def get_default_coords(district: str) -> tuple[float, float]:
    info = _priors().get(district, {})
    lat = float(info.get("lat", 31.95))
    lon = float(info.get("lon", info.get("lng", 35.88)))
    return lat, lon


def get_base_rate(district: str) -> float:
    """Price-per-sqm for a district, with sensible fallbacks.

    Order: ``base_sqm`` (the key the priors JSON actually uses) ->
    ``price_per_m2`` -> ``base_price_per_m2`` -> 900.
    """
    info = _priors().get(district, {})
    for key in ("base_sqm", "price_per_m2", "base_price_per_m2"):
        if key in info:
            try:
                return float(info[key])
            except (TypeError, ValueError):
                continue
    return DEFAULT_BASE_RATE_PER_SQM


def pil_to_stats(img: Image.Image) -> dict:
    """Cheap image-quality features lifted from fixed_app.py."""
    img = img.convert("RGB")
    small = img.resize((256, 256))
    stat = ImageStat.Stat(small)

    mean_rgb = np.array(stat.mean, dtype=np.float32)
    std_rgb = np.array(stat.stddev, dtype=np.float32)

    brightness = float(np.mean(mean_rgb) / 255.0)
    contrast = float(np.mean(std_rgb) / 128.0)

    gray = small.convert("L")
    gray_arr = np.array(gray, dtype=np.float32)

    gx = np.diff(gray_arr, axis=1)
    gy = np.diff(gray_arr, axis=0)
    sharpness = float((np.mean(np.abs(gx)) + np.mean(np.abs(gy))) / 255.0)

    exposure_penalty = 0.0
    if brightness < 0.25:
        exposure_penalty = (0.25 - brightness) * 0.8
    elif brightness > 0.90:
        exposure_penalty = (brightness - 0.90) * 0.6

    raw = (
        0.45 * brightness
        + 0.30 * min(contrast, 1.2)
        + 0.25 * min(sharpness, 1.0)
        - exposure_penalty
    )
    score = float(np.clip(0.75 + raw * 0.45, 0.70, 1.20))

    return {
        "brightness": round(brightness, 3),
        "contrast": round(contrast, 3),
        "sharpness": round(sharpness, 3),
        "score": round(score, 3),
    }


def analyze_image_bytes(payload: bytes, name: str | None = None) -> dict:
    img = Image.open(BytesIO(payload))
    feat = pil_to_stats(img)
    feat["name"] = name or "image"
    return feat


def aggregate_condition_score(per_image: list[dict]) -> float:
    if not per_image:
        return NEUTRAL_CONDITION_SCORE
    scores = [d["score"] for d in per_image if "score" in d]
    if not scores:
        return NEUTRAL_CONDITION_SCORE
    return round(float(np.mean(scores)), 3)


def _build_model_frame(
    *,
    area: float,
    bedrooms: int,
    bathrooms: int,
    floor: int,
    building_age: int,
    latitude: float,
    longitude: float,
    property_type: str,
    furnished: str,
    city: str,
    district: str,
    neighborhood: str,
    condition_score: float,
) -> pd.DataFrame:
    # IMPORTANT: column name is condition_score (matches training), NOT
    # condition_score_from_photos (the bug from the original Streamlit app).
    return pd.DataFrame(
        [
            {
                "area": area,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "floor": floor,
                "building_age": building_age,
                "latitude": latitude,
                "longitude": longitude,
                "property_type": property_type,
                "furnished": furnished,
                "city": city,
                "district": district,
                "neighborhood": neighborhood,
                "condition_score": condition_score,
            }
        ]
    )


def _safe_model_predict(features: pd.DataFrame) -> float | None:
    try:
        pred = float(_model().predict(features)[0])
        if np.isfinite(pred):
            return pred
    except Exception:
        return None
    return None


def compute_rule_based_estimate(
    *,
    district: str,
    area: float,
    building_age: int,
    furnished: str,
    property_type: str,
    condition_score: float,
) -> dict:
    base_rate = get_base_rate(district)
    base_price = area * base_rate

    furnished_bonus = 9000.0 if str(furnished).strip().lower() in {"yes", "true", "1"} else 0.0
    age_factor = max(0.70, 1 - (building_age * 0.012))
    property_type_factor = 1.00 if str(property_type).strip().lower() == "apartment" else 1.08
    photo_multiplier = 1 + (condition_score - 1.0) * 0.65

    estimate = (base_price * age_factor * property_type_factor * photo_multiplier) + furnished_bonus

    return {
        "baseRate": round(base_rate, 2),
        "basePrice": round(base_price, 2),
        "furnishedBonus": round(furnished_bonus, 2),
        "ageFactor": round(age_factor, 4),
        "propertyTypeFactor": round(property_type_factor, 4),
        "photoMultiplier": round(photo_multiplier, 4),
        "estimate": round(estimate, 2),
    }


def predict_property(
    *,
    area: float,
    bedrooms: int,
    bathrooms: int,
    floor: int,
    building_age: int,
    property_type: str,
    furnished: str,
    city: str,
    district: str,
    neighborhood: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    image_payloads: Iterable[tuple[str, bytes]] = (),
) -> dict[str, Any]:
    if district not in _priors():
        # Not fatal — the model also has district as a categorical and will
        # OneHotEncoder(handle_unknown='ignore') it. We still warn the caller.
        district_hint = f"District '{district}' is not in priors; rule-based fallback will use the default base rate."
    else:
        district_hint = None

    image_details: list[dict] = []
    for name, payload in list(image_payloads)[:MAX_IMAGES]:
        try:
            image_details.append(analyze_image_bytes(payload, name=name))
        except Exception as exc:
            image_details.append({"name": name or "image", "error": f"could not analyse: {exc}"})

    condition_score = aggregate_condition_score(
        [d for d in image_details if "score" in d]
    )

    if latitude is None or longitude is None:
        default_lat, default_lon = get_default_coords(district)
        if latitude is None:
            latitude = default_lat
        if longitude is None:
            longitude = default_lon

    if neighborhood is None or not str(neighborhood).strip():
        neighborhood = district

    rule_breakdown = compute_rule_based_estimate(
        district=district,
        area=area,
        building_age=building_age,
        furnished=furnished,
        property_type=property_type,
        condition_score=condition_score,
    )

    features = _build_model_frame(
        area=area,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        floor=floor,
        building_age=building_age,
        latitude=latitude,
        longitude=longitude,
        property_type=property_type,
        furnished=furnished,
        city=city,
        district=district,
        neighborhood=neighborhood,
        condition_score=condition_score,
    )

    model_estimate = _safe_model_predict(features)
    used_model = model_estimate is not None
    final_price = float(model_estimate if used_model else rule_breakdown["estimate"])

    range_low = round(final_price * (1 - PRICE_RANGE_TOLERANCE), 2)
    range_high = round(final_price * (1 + PRICE_RANGE_TOLERANCE), 2)

    return {
        "predictedPrice": round(final_price, 2),
        "modelEstimate": round(model_estimate, 2) if used_model else None,
        "ruleBasedEstimate": rule_breakdown["estimate"],
        "range": {"low": range_low, "high": range_high, "tolerance": PRICE_RANGE_TOLERANCE},
        "conditionScore": condition_score,
        "imagesUsed": len(image_details),
        "imageDetails": image_details,
        "breakdown": rule_breakdown,
        "usedModel": used_model,
        "inputs": {
            "area": area,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "floor": floor,
            "buildingAge": building_age,
            "propertyType": property_type,
            "furnished": furnished,
            "city": city,
            "district": district,
            "neighborhood": neighborhood,
            "latitude": latitude,
            "longitude": longitude,
        },
        "districtHint": district_hint,
    }
