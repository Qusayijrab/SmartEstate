import sys
import warnings
from pathlib import Path

# Allow ``import app`` and friends from inside the tests/ subdirectory.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# These warnings are noise during the test run but reflect known, intentional
# behaviour: sklearn loads 1.7.2-trained artifacts on 1.8.0, and pydantic
# emits a benign warning about FastAPI's per-field TypeAdapter usage.
from sklearn.exceptions import InconsistentVersionWarning  # noqa: E402
from pydantic.warnings import UnsupportedFieldAttributeWarning  # noqa: E402

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
warnings.filterwarnings("ignore", category=UnsupportedFieldAttributeWarning)


import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)
