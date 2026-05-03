"""Loan approval inference + Jordan bank recommendations.

Lifted and cleaned from `archive/first ai/banks.py` and `loan_app.py`. The model
itself (`loans_model.pkl`) is a `RandomForestClassifier` trained on the synthetic
100k-row loan dataset shipped in the archive.

Trained feature columns (exact order):
    no_of_dependents, education, self_employed, income_annum, loan_amount,
    loan_term, cibil_score
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

import joblib
import numpy as np

from config import MODEL_DIR


MODEL_PATH = MODEL_DIR / "loans_model.pkl"

FEATURE_COLUMNS = [
    "no_of_dependents",
    "education",
    "self_employed",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
]

EMI_INCOME_RATIO_LIMIT = 0.5
MIN_CIBIL_SCORE = 560

# Jordan retail-banking landscape with default product rates. Lifted from
# banks.py; rates are demo defaults, the user can override per request.
BANKS_CONFIG: dict[str, dict] = {
    "Housing Bank (HBTF)": {
        "type": "conventional",
        "products": {
            "House/Apartment": 7.0,
            "Land": 8.0,
            "Investment": 8.5,
            "ABJ First-Home Promo": 4.99,
        },
    },
    "Arab Bank": {
        "type": "conventional",
        "products": {
            "House/Apartment": 7.25,
            "Land": 7.75,
            "Investment": 8.25,
        },
    },
    "Bank of Jordan": {
        "type": "conventional",
        "products": {
            "House/Apartment": 7.25,
            "Investment": 8.25,
        },
    },
    "Bank al Etihad (Promo)": {
        "type": "conventional",
        "products": {
            "House/Apartment": 4.99,
        },
    },
    "AJIB": {
        "type": "conventional",
        "products": {
            "House/Apartment": 7.25,
        },
    },
    "Jordan Islamic Bank (JIB)": {
        "type": "islamic",
        "products": {
            "Home (Murabaha/Ijarah)": 7.0,
        },
    },
    "Islamic International Arab Bank (IIAB)": {
        "type": "islamic",
        "products": {
            "Real Estate": 7.0,
            "Land": 7.5,
        },
    },
    "Safwa Islamic Bank": {
        "type": "islamic",
        "products": {
            "Real Estate": 7.0,
        },
    },
}


@dataclass(frozen=True)
class BankRecommendation:
    bank: str
    product: str
    rate: float
    bank_type: Literal["conventional", "islamic"]


@lru_cache(maxsize=1)
def _model():
    return joblib.load(MODEL_PATH)


def calculate_emi(principal: float, annual_rate_pct: float, n_months: int) -> float:
    """Standard amortising-loan monthly payment."""
    r = (annual_rate_pct / 100.0) / 12.0
    if n_months <= 0:
        return float("inf")
    if r == 0:
        return principal / n_months
    return (principal * r * (1 + r) ** n_months) / ((1 + r) ** n_months - 1)


def resolve_rate(bank: str | None, purpose: str | None, override_rate: float | None) -> tuple[float, str | None, str | None, str | None]:
    """Pick the interest/profit rate.

    Priority: explicit override -> bank+purpose lookup -> generic 7% fallback.
    Returns (rate, resolved_bank, resolved_purpose, bank_type).
    """
    if override_rate is not None and override_rate > 0:
        return float(override_rate), bank, purpose, BANKS_CONFIG.get(bank or "", {}).get("type")

    if bank and bank in BANKS_CONFIG:
        products = BANKS_CONFIG[bank]["products"]
        if purpose and purpose in products:
            return float(products[purpose]), bank, purpose, BANKS_CONFIG[bank]["type"]
        # Fall back to first product the bank offers.
        first_purpose, first_rate = next(iter(products.items()))
        return float(first_rate), bank, first_purpose, BANKS_CONFIG[bank]["type"]

    return 7.0, bank, purpose, None


def recommend_banks(salary_monthly: float, purpose: str | None) -> list[BankRecommendation]:
    """Hybrid rule-based bank picker. Mirrors banks.py logic but returns structured data."""
    home_purposes = {"House/Apartment", "Home (Murabaha/Ijarah)", "Real Estate"}
    is_home_purpose = (purpose or "") in home_purposes

    recs: list[BankRecommendation] = []

    if salary_monthly < 800:
        if is_home_purpose:
            recs.append(BankRecommendation("Housing Bank (HBTF)", "ABJ First-Home Promo", 4.99, "conventional"))
            recs.append(BankRecommendation("Bank al Etihad (Promo)", "House/Apartment", 4.99, "conventional"))
        else:
            recs.append(BankRecommendation("Jordan Islamic Bank (JIB)", "Home (Murabaha/Ijarah)", 7.0, "islamic"))
            recs.append(BankRecommendation("Islamic International Arab Bank (IIAB)", "Land", 7.5, "islamic"))
    elif salary_monthly >= 3000:
        if is_home_purpose:
            recs.append(BankRecommendation("AJIB", "House/Apartment", 7.25, "conventional"))
            recs.append(BankRecommendation("Arab Bank", "House/Apartment", 7.25, "conventional"))
        else:
            recs.append(BankRecommendation("Arab Bank", "Investment", 8.25, "conventional"))
            recs.append(BankRecommendation("Bank of Jordan", "Investment", 8.25, "conventional"))
    else:
        recs.append(BankRecommendation("Housing Bank (HBTF)", "House/Apartment", 7.0, "conventional"))
        recs.append(BankRecommendation("Jordan Islamic Bank (JIB)", "Home (Murabaha/Ijarah)", 7.0, "islamic"))

    return recs


def predict_loan(
    *,
    income_monthly: float,
    loan_amount: float,
    loan_term_years: float,
    cibil_score: int,
    no_of_dependents: int = 0,
    education: str = "Graduate",
    self_employed: str = "No",
    bank: str | None = None,
    purpose: str | None = None,
    interest_rate: float | None = None,
) -> dict:
    """Run the loan-approval pipeline end-to-end.

    Hard business rules are checked first; only if they pass do we hit the ML
    model. This matches the original Streamlit logic.
    """
    income_monthly = float(income_monthly)
    loan_amount = float(loan_amount)
    loan_term_years = float(loan_term_years)
    cibil_score = int(cibil_score)

    if income_monthly <= 0 or loan_amount <= 0 or loan_term_years <= 0:
        raise ValueError("incomeMonthly, loanAmount and loanTermYears must all be positive.")

    rate, resolved_bank, resolved_purpose, bank_type = resolve_rate(bank, purpose, interest_rate)
    loan_term_months = int(round(loan_term_years * 12))
    income_annum = income_monthly * 12.0

    emi = calculate_emi(loan_amount, rate, loan_term_months)
    affordability_ratio = emi / income_monthly if income_monthly > 0 else float("inf")

    decision: Literal["approved", "rejected"]
    reason: str
    used_model = False

    if emi > income_monthly * EMI_INCOME_RATIO_LIMIT:
        decision = "rejected"
        reason = (
            f"EMI of {emi:,.2f} JOD exceeds 50% of monthly income "
            f"({income_monthly:,.2f} JOD)."
        )
    elif cibil_score < MIN_CIBIL_SCORE:
        decision = "rejected"
        reason = f"CIBIL score {cibil_score} is below the minimum {MIN_CIBIL_SCORE}."
    else:
        # The classifier was trained on a numpy ndarray (loans(1).py used
        # df[features].values), so we keep it nameless to avoid sklearn's
        # "fitted without feature names" warning.
        features = np.array(
            [[
                no_of_dependents,
                1 if str(education).strip().lower() == "graduate" else 0,
                1 if str(self_employed).strip().lower() in {"yes", "true", "1"} else 0,
                income_annum,
                loan_amount,
                loan_term_months,
                cibil_score,
            ]],
            dtype=float,
        )
        prediction = int(_model().predict(features)[0])
        used_model = True
        if prediction == 1:
            decision = "approved"
            reason = "Hard rules passed and the ML model approved the application."
        else:
            decision = "rejected"
            reason = "Hard rules passed but the ML model rejected the application."

    recommendations = recommend_banks(income_monthly, resolved_purpose)

    return {
        "decision": decision,
        "emi": round(emi, 2),
        "affordabilityRatio": round(affordability_ratio, 4),
        "interestRate": round(rate, 4),
        "bank": resolved_bank,
        "bankType": bank_type,
        "purpose": resolved_purpose,
        "loanTermMonths": loan_term_months,
        "incomeAnnum": round(income_annum, 2),
        "usedModel": used_model,
        "reason": reason,
        "recommendedBanks": [
            {
                "bank": r.bank,
                "product": r.product,
                "rate": r.rate,
                "bankType": r.bank_type,
            }
            for r in recommendations
        ],
    }
