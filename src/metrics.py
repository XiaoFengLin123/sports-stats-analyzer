def rolling_average(series, window=3):
    # min_periods=1 means: compute average even if we have fewer than "window" points
    return series.rolling(window=window, min_periods=1).mean()