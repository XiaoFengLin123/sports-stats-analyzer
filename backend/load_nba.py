from nba_api.stats.endpoints import playergamelogs
import pandas as pd
from sqlalchemy import create_engine

# --- SETUP ---
engine = create_engine("sqlite:///sports.db")

def sync_entire_league(season="2025-26"):
    print(f"🚀 Fetching all game logs for the {season} season...")
    
    # 1. Fetch ALL player game logs for the season in ONE go
    # This returns one row for every player per game they played
    logs = playergamelogs.PlayerGameLogs(season_nullable=season)
    df = logs.get_data_frames()[0]

    # 2. Map the API columns to your database columns
    # The API returns uppercase, so we lowercase them to match your schema
    out = pd.DataFrame({
        "player_id": df["PLAYER_ID"],
        "player_name": df["PLAYER_NAME"],
        "game_id": df["GAME_ID"],
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

    # 3. Smart-Load (Only add games we don't have)
    try:
        # We check for a unique string of "PlayerID_GameID"
        query = "SELECT CAST(player_id AS TEXT) || '_' || CAST(game_id AS TEXT) as unique_key FROM games"
        existing_keys = pd.read_sql(query, engine)["unique_key"].tolist()
        
        # Create the same key in our new data
        out["unique_key"] = out["player_id"].astype(str) + "_" + out["game_id"].astype(str)
        
        # Filter out the stuff we already have
        new_games = out[~out["unique_key"].isin(existing_keys)].drop(columns=["unique_key"])
    except Exception as e:
        new_games = out # Table doesn't exist yet

    # 4. Save
    if not new_games.empty:
        new_games.to_sql("games", engine, if_exists="append", index=False)
        print(f"✅ Successfully synced {len(new_games)} new player-game entries.")
    else:
        print("ℹ️ Everything is already up to date.")

if __name__ == "__main__":
    sync_entire_league()