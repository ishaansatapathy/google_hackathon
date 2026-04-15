"""
Train a tiny sklearn model on *synthetic* Bengaluru congestion labels so you can
show a "model card" / notebook story. The live app uses the same closed form in
`src/lib/emergency/congestionPredictor.ts` (no Python required at runtime).

Optional deps:
  pip install -r scripts/requirements-congestion.txt

Free APIs worth trying later (no cost for light / dev use — check current limits):
  - OpenStreetMap / Overpass API — raw roads & POIs, no key.
  - Open-Meteo (https://open-meteo.com) — weather correlates with traffic; free, no key.
  - OpenRouteService (https://openrouteservice.org) — matrix / isochrones; free API key.
  - TomTom Traffic Flow — has a free monthly quota (needs key).
  - HERE Traffic — developer free tier (needs key).
  - OSRM public demo — routing only (already used in app); self-host for volume.

Run:
  python scripts/train_congestion_dummy.py
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "src" / "lib" / "emergency" / "congestion_model_meta.json"


def synthetic_label(hour: float, dow: int) -> float:
    """Same intent as predictCityCongestionIndex in TypeScript."""
    phase = (hour / 24.0) * 2 * math.pi
    daily = 48 + 26 * math.sin(phase - 0.4) + 6 * math.sin(2 * phase)
    week = -10 if dow in (0, 6) else 11
    return float(np.clip(daily + week, 0, 100))


def main() -> None:
    random.seed(42)
    np.random.seed(42)
    rows_x: list[list[float]] = []
    rows_y: list[float] = []
    for _ in range(800):
        h = random.uniform(0, 23.99)
        dow = random.randint(0, 6)
        y = synthetic_label(h, dow) + random.gauss(0, 4)
        y = float(np.clip(y, 0, 100))
        phase = (h / 24.0) * 2 * math.pi
        # Features: sin/cos hour + weekend flag
        is_weekend = 1.0 if dow in (0, 6) else 0.0
        rows_x.append([math.sin(phase), math.cos(phase), is_weekend])
        rows_y.append(y)

    X = np.array(rows_x)
    y = np.array(rows_y)
    model = LinearRegression()
    model.fit(X, y)
    pred = model.predict(X)
    r2 = r2_score(y, pred)

    payload = {
        "model": "LinearRegression",
        "features": ["sin(hour_phase)", "cos(hour_phase)", "is_weekend"],
        "r2_train": round(float(r2), 4),
        "intercept": round(float(model.intercept_), 4),
        "coef": [round(float(c), 4) for c in model.coef_.tolist()],
        "note": "Demo only — labels are synthetic. Wire ORS/TomTom/HERE later.",
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))
    print(f"\nWrote {OUT_JSON}")


if __name__ == "__main__":
    main()
