from typing import Annotated, Literal, Optional

from pydantic import Field

from schemas._base import CamelModel


class LoanRequest(CamelModel):
    income_monthly: Annotated[float, Field(gt=0, description="Net monthly income in JOD.")]
    loan_amount: Annotated[float, Field(gt=0, description="Requested principal in JOD.")]
    loan_term_years: Annotated[float, Field(gt=0, le=40)]
    cibil_score: Annotated[int, Field(ge=300, le=900)]

    no_of_dependents: Annotated[int, Field(ge=0, le=20)] = 0
    education: Literal["Graduate", "Not Graduate"] = "Graduate"
    self_employed: Literal["Yes", "No"] = "No"

    bank: Optional[str] = None
    purpose: Optional[str] = None
    interest_rate: Annotated[Optional[float], Field(gt=0, le=30)] = None


class BankRecommendation(CamelModel):
    bank: str
    product: str
    rate: float
    bank_type: Optional[str] = None


class LoanResponse(CamelModel):
    decision: Literal["approved", "rejected"]
    emi: float
    affordability_ratio: float
    interest_rate: float
    bank: Optional[str]
    bank_type: Optional[str] = None
    purpose: Optional[str]
    loan_term_months: int
    income_annum: float
    used_model: bool
    reason: str
    recommended_banks: list[BankRecommendation]
