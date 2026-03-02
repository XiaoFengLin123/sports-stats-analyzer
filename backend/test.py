import sqlite3
conn = sqlite3.connect("sports.db")
cursor = conn.execute("SELECT * FROM games LIMIT 1")
print(cursor.description) # This prints all column names
conn.close()