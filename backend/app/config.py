import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = os.path.join(BASE_DIR, "fueltrust_v2.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

DEFAULT_VERIFICATION_THRESHOLD = 2.0  # Percentage (%)
DEFAULT_FUEL_TYPE = "Diesel"
DEFAULT_UNIT = "Litres"
DEMO_MODE = True
