from fastapi import APIRouter, HTTPException

from ai.land import list_districts, predict_land
from schemas.land import LandRequest, LandResponse


router = APIRouter()


@router.get("/land/districts", tags=["land"])
def land_districts() -> dict:
    return {"districts": list_districts()}


@router.post("/land", response_model=LandResponse, response_model_by_alias=True)
def land(payload: LandRequest) -> LandResponse:
    try:
        # The inference layer expects snake_case dict keys; pydantic gives us
        # those via .model_dump() (no by_alias=True).
        result = predict_land(payload.model_dump(exclude_none=False))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return LandResponse.model_validate(result)
