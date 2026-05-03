import warnings

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic.warnings import UnsupportedFieldAttributeWarning
from sklearn.exceptions import InconsistentVersionWarning

# Pydantic 2.13+ emits a benign UnsupportedFieldAttributeWarning whenever
# FastAPI builds a per-field TypeAdapter for a model that uses an
# alias_generator. The aliases work correctly at the model level; this warning
# is just noise from pydantic's own internals reading its own metadata.
warnings.filterwarnings("ignore", category=UnsupportedFieldAttributeWarning)

# Two of the lifted artifacts (loans_model.pkl, the original land pipeline)
# were trained on scikit-learn 1.7.2 and we run on >=1.8. The predictions are
# unchanged in practice; the warning fires only on first model load.
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

from config import settings
from routes import land, loan
from routes import property as property_router


app = FastAPI(title="SmartEstate AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(loan.router, prefix="/api/ai", tags=["loan"])
app.include_router(property_router.router, prefix="/api/ai", tags=["property"])
app.include_router(land.router, prefix="/api/ai", tags=["land"])


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {"ok": True, "service": "smartestate-ai"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
