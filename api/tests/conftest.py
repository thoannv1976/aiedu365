import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("LLM_PROVIDER", "echo")
os.environ.setdefault("USE_FIRESTORE", "false")
os.environ.setdefault("DATA_DIR", str(ROOT.parent / "data"))

import pytest  # noqa: E402

from app.services.store import get_store  # noqa: E402


@pytest.fixture(scope="session")
def store():
    return get_store()
