from typing import Annotated, Literal, Optional

from pydantic import Field

from schemas._base import CamelModel


class LandRequest(CamelModel):
    district: str
    area_name: str = "Unknown Area"
    land_area_sqm: Annotated[float, Field(gt=0, le=100000)]
    land_type: Literal["residential", "commercial", "agricultural"] = "residential"
    street_width_m: Annotated[float, Field(ge=0, le=200)] = 12.0
    main_road_access: bool = False
    near_services: bool = False
    zoning_category: str = "B"
    zoning_score: Annotated[float, Field(ge=0, le=10)] = 6.0
    development_level: Literal["low", "medium", "high", "prime"] = "medium"
    corner_plot: bool = False
    shape_regular: bool = True
    slope_level: Literal["flat", "moderate", "steep"] = "flat"
    lat: Optional[float] = None
    lng: Optional[float] = None
    asking_price_jod: Annotated[Optional[float], Field(ge=0)] = None


class LandInputUsed(CamelModel):
    district: str
    area_name: str
    land_area_sqm: float
    land_type: str
    street_width_m: float
    main_road_access: int
    near_services: int
    zoning_category: str
    zoning_score: float
    development_level: str
    corner_plot: int
    shape_regular: int
    slope_level: str
    lat: float
    lng: float
    asking_price_jod: Optional[float] = None


class LandResponse(CamelModel):
    predicted_land_value_jod: float
    predicted_price_per_sqm_jod: float
    fairness_label: str
    price_ratio: Optional[float] = None
    difference_jod: Optional[float] = None
    difference_pct: Optional[float] = None
    recommendation_text: str
    input_used: LandInputUsed
