from typing import Optional

from schemas._base import CamelModel


class PriceRange(CamelModel):
    low: float
    high: float
    tolerance: float


class RuleBreakdown(CamelModel):
    base_rate: float
    base_price: float
    furnished_bonus: float
    age_factor: float
    property_type_factor: float
    photo_multiplier: float
    estimate: float


class ImageDetail(CamelModel):
    name: str
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    sharpness: Optional[float] = None
    score: Optional[float] = None
    error: Optional[str] = None


class PropertyInputs(CamelModel):
    area: float
    bedrooms: int
    bathrooms: int
    floor: int
    building_age: int
    property_type: str
    furnished: str
    city: str
    district: str
    neighborhood: str
    latitude: float
    longitude: float


class PropertyResponse(CamelModel):
    predicted_price: float
    model_estimate: Optional[float] = None
    rule_based_estimate: float
    range: PriceRange
    condition_score: float
    images_used: int
    image_details: list[ImageDetail]
    breakdown: RuleBreakdown
    used_model: bool
    inputs: PropertyInputs
    district_hint: Optional[str] = None
