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

DATA_PATH = "../data/games.csv"

@app.get("/api/bar")
def bar(
    name: str = Query(..., description="Player name"),
    metric: str = Query(..., description="Stat like PTS, REB, AST"),
):
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()

    if metric not in df.columns:
        return {"error": f"Unknown metric: {metric}", "available": list(df.columns)}

    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date")

    df = df[df["Name"].str.lower() == name.lower()]

    if df.empty:
        return {"error": f"No data for player {name}"}

    labels = df["Date"].dt.strftime("%Y-%m-%d").tolist()
    values = df[metric].fillna(0).tolist()

    return {
        "labels": labels,
        "values": values,
        "name": name,
        "metric": metric,
    }