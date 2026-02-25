from load_data import load_csv
from metrics import rolling_average
from plot import plot_stat

data = load_csv("data/sample_stats.csv")

rolling = rolling_average(data["points"], window=3)
plot_stat(data["date"], data["points"], rolling)