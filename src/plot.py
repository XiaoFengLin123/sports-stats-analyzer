import matplotlib.pyplot as plt

def plot_stat(dates, values, rolling):
    plt.figure(figsize=(10,5))
    plt.plot(dates, values, label="Points")
    plt.plot(dates, rolling, label="Rolling Average")
    plt.legend()
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()