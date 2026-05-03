from typing import Annotated, Literal, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ai.property import MAX_IMAGES, SUPPORTED_IMAGE_TYPES, list_districts, predict_property
from schemas.property import PropertyResponse


router = APIRouter()


@router.get("/property/districts", tags=["property"])
def property_districts() -> dict:
    return {"districts": list_districts()}


@router.post("/property", response_model=PropertyResponse, response_model_by_alias=True)
async def property_price(
    area: Annotated[float, Form(gt=0, le=10000)],
    bedrooms: Annotated[int, Form(ge=0, le=20)],
    bathrooms: Annotated[int, Form(ge=0, le=20)],
    floor: Annotated[int, Form(ge=0, le=80)],
    building_age: Annotated[int, Form(alias="buildingAge", ge=0, le=100)],
    district: Annotated[str, Form(min_length=1)],
    property_type: Annotated[Literal["apartment", "house"], Form(alias="propertyType")] = "apartment",
    furnished: Annotated[Literal["yes", "no"], Form()] = "no",
    city: Annotated[str, Form()] = "Amman",
    neighborhood: Annotated[Optional[str], Form()] = None,
    latitude: Annotated[Optional[float], Form()] = None,
    longitude: Annotated[Optional[float], Form()] = None,
    images: Annotated[list[UploadFile], File(description=f"Up to {MAX_IMAGES} property photos")] = None,
) -> PropertyResponse:
    image_payloads: list[tuple[str, bytes]] = []
    for upload in images or []:
        if not upload or not upload.filename:
            continue
        ext = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
        if ext and ext not in SUPPORTED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image type '.{ext}'. Allowed: {sorted(SUPPORTED_IMAGE_TYPES)}",
            )
        payload = await upload.read()
        image_payloads.append((upload.filename, payload))

    try:
        result = predict_property(
            area=area,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            floor=floor,
            building_age=building_age,
            property_type=property_type,
            furnished=furnished,
            city=city,
            district=district,
            neighborhood=neighborhood,
            latitude=latitude,
            longitude=longitude,
            image_payloads=image_payloads,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PropertyResponse.model_validate(result)
