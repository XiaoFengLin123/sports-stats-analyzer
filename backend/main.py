from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import pandas as pd

app = FastAPI()

# VERY IMPORTANT: This allows your React app (usually on port 3000 or 5173) 
# to talk to your Python app (on port 8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "sports.db"

@app.get("/api/bar")
def get_player_stats(name: str = "LeBron James", metric: str = "PTS"):
    # 1. Connect to our sports.db
    conn = sqlite3.connect(DB_PATH)
    
    # 2. Convert metric (e.g., "PTS") to match our DB column names (pts)
    # Your React uses "PTS", but our DB uses "pts"

    
    METRIC_MAP = {
    "PTS": "pts",
    "REB": "reb",
    "AST": "ast",
    "BLK": "blk",
    "STL": "stl",
    "TO": "to",   # change this if your DB uses "to"
}
    db_column = METRIC_MAP.get(metric)

    if not db_column:return {"error": f"Invalid metric: {metric}"}
    
    # 3. Query the data
    query = f"""
        SELECT game_date as date, matchup as opp, "{db_column}" as value 
        FROM games 
        WHERE player_name LIKE ? 
        ORDER BY date ASC
    """
    
    try:
        df = pd.read_sql(query, conn, params=(f"%{name}%",))
        # Format the date so it looks nice on the X-Axis
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%b %d')
        
        return {
            "name": name,
            "metric": metric,
            "rows": df.to_dict(orient="records")
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)