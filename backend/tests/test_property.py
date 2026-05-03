from io import BytesIO

import numpy as np
from PIL import Image


def _fake_jpeg(seed: int = 0) -> bytes:
    rng = np.random.RandomState(seed)
    arr = (rng.rand(400, 600, 3) * 80 + 120).astype("uint8")
    buf = BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    return buf.getvalue()


def test_property_districts(client):
    r = client.get("/api/ai/property/districts")
    assert r.status_code == 200
    districts = r.json()["districts"]
    assert "Abdoun" in districts
    assert "Khalda" in districts
    assert districts == sorted(districts)


def test_property_no_images(client):
    r = client.post(
        "/api/ai/property",
        data={
            "area": 150,
            "bedrooms": 3,
            "bathrooms": 2,
            "floor": 1,
            "buildingAge": 8,
            "district": "Abdoun",
            "propertyType": "apartment",
            "furnished": "yes",
            "city": "Amman",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["usedModel"] is True
    assert body["predictedPrice"] > 0
    assert body["modelEstimate"] is not None
    assert body["conditionScore"] == 1.0
    assert body["imagesUsed"] == 0
    assert body["range"]["low"] < body["predictedPrice"] < body["range"]["high"]
    assert body["breakdown"]["baseRate"] == 1200.0  # confirms the base_sqm priors fix


def test_property_with_images(client):
    files = [
        ("images", ("living.jpg", _fake_jpeg(0), "image/jpeg")),
        ("images", ("kitchen.jpg", _fake_jpeg(1), "image/jpeg")),
    ]
    r = client.post(
        "/api/ai/property",
        data={
            "area": 220,
            "bedrooms": 4,
            "bathrooms": 3,
            "floor": 2,
            "buildingAge": 5,
            "district": "Khalda",
            "propertyType": "house",
            "furnished": "yes",
            "city": "Amman",
        },
        files=files,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["imagesUsed"] == 2
    assert len(body["imageDetails"]) == 2
    assert all("score" in d for d in body["imageDetails"])
    assert 0.7 <= body["conditionScore"] <= 1.2
    assert body["usedModel"] is True


def test_property_rejects_unknown_image_type(client):
    r = client.post(
        "/api/ai/property",
        data={
            "area": 150,
            "bedrooms": 3,
            "bathrooms": 2,
            "floor": 1,
            "buildingAge": 8,
            "district": "Abdoun",
        },
        files=[("images", ("doc.pdf", b"not an image", "application/pdf"))],
    )
    assert r.status_code == 400
