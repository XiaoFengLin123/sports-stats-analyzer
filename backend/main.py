from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import pandas as pd
import numpy as np

app = FastAPI()

# Enable communication between React and FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "sports.db"

# --- 1. PLAYER SEARCH ENDPOINT ---
@app.get("/api/players")
def search_players(q: str = ""):
    conn = sqlite3.connect(DB_PATH)
    if len(q) < 2: return {"players": []}
    try:
        query = "SELECT DISTINCT player_name FROM games WHERE player_name LIKE ? LIMIT 10"
        df = pd.read_sql(query, conn, params=(f"%{q}%",))
        return {"players": df["player_name"].tolist()}
    finally:
        conn.close()

# --- 2. GRAPH DATA ENDPOINT ---
@app.get("/api/bar")
def get_player_stats(name: str = "LeBron James", metric: str = "PTS"):
    conn = sqlite3.connect(DB_PATH)
    METRIC_MAP = {"PTS": "pts", "REB": "reb", "AST": "ast", "BLK": "blk", "STL": "stl", "TO": "to"}
    db_column = METRIC_MAP.get(metric, "pts")
    
    try:
        query = f'SELECT game_date, matchup, "{db_column}" as value FROM games WHERE player_name = ?'
        df = pd.read_sql(query, conn, params=(name,))
        
        if df.empty:
            return {"name": name, "metric": metric, "rows": []}

        # Format and Sort
        df['date'] = pd.to_datetime(df['game_date']).dt.strftime('%b %d')
        df['opp'] = df['matchup'].str.split(' ').str[-1]
        df['game_date_dt'] = pd.to_datetime(df['game_date'])
        df = df.sort_values('game_date_dt')

        # Clean NaNs for JSON compatibility
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})

        rows = df[['date', 'opp', 'value']].to_dict(orient="records")
        return {"name": name, "metric": metric, "rows": rows}
    except Exception as e:
        print(f"Stats Error: {e}")
        return {"error": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)