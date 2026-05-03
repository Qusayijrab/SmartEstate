def test_land_districts(client):
    r = client.get("/api/ai/land/districts")
    assert r.status_code == 200
    districts = r.json()["districts"]
    assert "Khalda" in districts
    assert "Abdoun" in districts
    assert "Tabarbour" in districts


def test_land_with_asking_price(client):
    r = client.post(
        "/api/ai/land",
        json={
            "district": "Khalda",
            "areaName": "Khalda North",
            "landAreaSqm": 780,
            "landType": "residential",
            "streetWidthM": 16,
            "mainRoadAccess": True,
            "nearServices": True,
            "zoningCategory": "B",
            "zoningScore": 8,
            "developmentLevel": "high",
            "cornerPlot": True,
            "shapeRegular": True,
            "slopeLevel": "flat",
            "askingPriceJod": 620000,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["predictedLandValueJod"] > 0
    assert body["predictedPricePerSqmJod"] > 0
    assert body["fairnessLabel"] in {"Underpriced", "Fair Price", "Overpriced"}
    assert body["priceRatio"] is not None
    assert body["differenceJod"] is not None
    assert body["differencePct"] is not None
    assert body["recommendationText"]
    assert body["inputUsed"]["district"] == "Khalda"


def test_land_without_asking_price(client):
    r = client.post(
        "/api/ai/land",
        json={
            "district": "Tabarbour",
            "landAreaSqm": 500,
            "landType": "residential",
            "streetWidthM": 10,
            "zoningCategory": "C",
            "zoningScore": 5,
            "developmentLevel": "medium",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["fairnessLabel"] == "N/A"
    assert body["priceRatio"] is None
    assert body["predictedLandValueJod"] > 0


def test_land_uses_district_default_coords(client):
    r = client.post(
        "/api/ai/land",
        json={
            "district": "Sahab",
            "landAreaSqm": 600,
            "landType": "commercial",
            "streetWidthM": 14,
            "zoningCategory": "commercial_local",
            "zoningScore": 6,
            "developmentLevel": "medium",
        },
    )
    assert r.status_code == 200
    body = r.json()
    used = body["inputUsed"]
    # Sahab default coords from DISTRICT_COORD_DEFAULTS
    assert used["lat"] == 31.8690
    assert used["lng"] == 36.0050
