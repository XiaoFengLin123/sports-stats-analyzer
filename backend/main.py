from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Allow React dev server to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stats")
def get_stats(stat: str = "points", window: int = 3):
    df = pd.read_csv("../data/sample_stats.csv")
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    if stat not in df.columns:
        return {"error": f"Unknown stat: {stat}", "available": [c for c in df.columns if c != "date"]}

    rolling = df[stat].rolling(window=window, min_periods=1).mean()

    # Send JSON to frontend
    return {
        "stat": stat,
        "window": window,
        "dates": df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "values": df[stat].tolist(),
        "rolling": rolling.tolist(),
    }