import pandas as pd
import matplotlib.pyplot as plt

def load_stats(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date")

def compute_rolling(df: pd.DataFrame, stat: str, window: int):
    return df[stat].rolling(window=window, min_periods=1).mean()

def build_figure(df: pd.DataFrame, stat: str, window: int):
    rolling = compute_rolling(df, stat, window)

    fig, ax = plt.subplots()
    ax.plot(df["date"], df[stat], label=stat.title())
    ax.plot(df["date"], rolling, label=f"Rolling Avg (window={window})")
    ax.legend()
    ax.set_xlabel("Date")
    ax.set_ylabel(stat.title())
    return fig