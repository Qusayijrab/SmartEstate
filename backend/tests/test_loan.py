def test_loan_happy_path(client):
    r = client.post(
        "/api/ai/loan",
        json={
            "incomeMonthly": 1500,
            "loanAmount": 50000,
            "loanTermYears": 15,
            "cibilScore": 720,
            "noOfDependents": 1,
            "education": "Graduate",
            "selfEmployed": "No",
            "bank": "Housing Bank (HBTF)",
            "purpose": "House/Apartment",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] in {"approved", "rejected"}
    assert body["interestRate"] == 7.0
    assert body["bank"] == "Housing Bank (HBTF)"
    assert body["bankType"] == "conventional"
    assert body["loanTermMonths"] == 180
    assert body["incomeAnnum"] == 18000.0
    assert body["usedModel"] is True
    assert body["affordabilityRatio"] < 0.5
    assert isinstance(body["recommendedBanks"], list) and body["recommendedBanks"]


def test_loan_rejected_by_emi_rule(client):
    r = client.post(
        "/api/ai/loan",
        json={
            "incomeMonthly": 200,
            "loanAmount": 50000,
            "loanTermYears": 15,
            "cibilScore": 720,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] == "rejected"
    assert body["usedModel"] is False
    assert "exceeds 50%" in body["reason"]


def test_loan_rejected_by_cibil_gate(client):
    r = client.post(
        "/api/ai/loan",
        json={
            "incomeMonthly": 1500,
            "loanAmount": 50000,
            "loanTermYears": 15,
            "cibilScore": 500,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] == "rejected"
    assert body["usedModel"] is False
    assert "CIBIL" in body["reason"]


def test_loan_validation_error(client):
    r = client.post(
        "/api/ai/loan",
        json={"incomeMonthly": -10, "loanAmount": 50000, "loanTermYears": 15, "cibilScore": 720},
    )
    assert r.status_code == 422
