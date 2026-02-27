from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "games.csv"


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}


@app.get("/api/bar")
def bar(
    name: str = Query(..., description="Player name (e.g. Lebron)"),
    metric: str = Query(..., description="Stat column (e.g. PTS, REB, AST, BLK, STL, PF, TO)"),
):
    df = pd.read_csv(DATA_PATH)

    # Clean up headers + key string cols
    df.columns = df.columns.str.strip()
    if "Name" in df.columns:
        df["Name"] = df["Name"].astype(str).str.strip()
    if "Opp" in df.columns:
        df["Opp"] = df["Opp"].astype(str).str.strip()

    # Validate required columns
    required = {"Name", "Date", "Opp"}
    missing = [c for c in required if c not in df.columns]
    if missing:
        return {"error": f"Missing required columns: {missing}", "available": list(df.columns)}

    # Validate metric
    if metric not in df.columns:
        return {"error": f"Unknown metric: {metric}", "available": list(df.columns)}

    # Parse + sort by date safely
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date"]).sort_values("Date")

    # Filter player
    df = df[df["Name"].str.lower() == name.lower()]
    if df.empty:
        return {"error": f"No data for player {name}"}

    # Build rows for frontend (tooltip can show opp)
    rows = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "opp": o,
            "value": float(v) if pd.notna(v) else 0.0,
        }
        for d, o, v in zip(df["Date"], df["Opp"], df[metric])
    ]

    return {"name": name, "metric": metric, "rows": rows}