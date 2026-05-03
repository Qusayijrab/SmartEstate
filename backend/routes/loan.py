from fastapi import APIRouter, HTTPException

from ai.loan import predict_loan
from schemas.loan import LoanRequest, LoanResponse


router = APIRouter()


@router.post("/loan", response_model=LoanResponse, response_model_by_alias=True)
def loan(payload: LoanRequest) -> LoanResponse:
    try:
        result = predict_loan(
            income_monthly=payload.income_monthly,
            loan_amount=payload.loan_amount,
            loan_term_years=payload.loan_term_years,
            cibil_score=payload.cibil_score,
            no_of_dependents=payload.no_of_dependents,
            education=payload.education,
            self_employed=payload.self_employed,
            bank=payload.bank,
            purpose=payload.purpose,
            interest_rate=payload.interest_rate,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return LoanResponse.model_validate(result)
