import pandas as pd
import sqlite3
from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static import players
from sqlalchemy import create_engine, inspect
from pathlib import Path

# --- SETUP ---
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "sports.db"
engine = create_engine(f"sqlite:///{DB_PATH}")

def get_player_id(name: str) -> int:
    res = players.find_players_by_full_name(name)
    if not res:
        raise ValueError(f"Player not found: {name}")
    return res[0]["id"]

def load_player_games(full_name: str, season: str = "2025-26"):
    # 1. Fetch data from API
    player_id = get_player_id(full_name)
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = gamelog.get_data_frames()[0]

    # 2. Transform into our desired schema
    out = pd.DataFrame({
        "player_id": player_id,
        "player_name": full_name,
        "game_id": df["Game_ID"],
        "game_date": pd.to_datetime(df["GAME_DATE"]),
        "matchup": df["MATCHUP"],
        "wl": df["WL"],
        "min": df["MIN"],
        "pts": df["PTS"],
        "reb": df["REB"],
        "ast": df["AST"],
        "stl": df["STL"],
        "blk": df["BLK"],
        "to": df["TOV"]
    })

    # 3. Smart-Load (Deduplication)
    # Check if the table exists first
    if inspect(engine).has_table("games"):
        # Get existing IDs so we don't add them twice
        existing_ids = pd.read_sql("SELECT game_id FROM games", engine)["game_id"].tolist()
        # Only keep rows where game_id is NOT in the database already
        new_games = out[~out["game_id"].isin(existing_ids)]
    else:
        new_games = out

    # 4. Save only the new stuff
    if not new_games.empty:
        new_games.to_sql("games", engine, if_exists="append", index=False)
        print(f"✅ Added {len(new_games)} new games for {full_name}.")
    else:
        print(f"ℹ️ No new games found for {full_name}. Database is already up to date.")

if __name__ == "__main__":
    # You can now add multiple players here safely!
    players_to_track = ["LeBron James", "Stephen Curry", "Kevin Durant"]
    
    for player in players_to_track:
        load_player_games(player, season="2025-26")