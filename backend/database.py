# database.py — handles saving and loading chat messages
import sqlite3
from datetime import datetime

# This function creates the database file and the messages table
# It runs once when the app starts
def init_db():
    # Connect to (or create) a file called chat_history.db
    conn = sqlite3.connect("chat_history.db")
    cursor = conn.cursor()
    
    # Create a table to store messages (if it doesn't exist yet)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role      TEXT NOT NULL,
            content   TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Save a single message to the database
def save_message(session_id, role, content):
    conn = sqlite3.connect("chat_history.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
        (session_id, role, content, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

# Get all messages for a session (the full chat history)
def get_history(session_id):
    conn = sqlite3.connect("chat_history.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role, content, timestamp FROM messages WHERE session_id = ? ORDER BY id",
        (session_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    # Convert the rows into a list of dictionaries
    return [{"role": row[0], "content": row[1], "timestamp": row[2]} for row in rows]

# Delete all messages for a session (clear chat button)
def clear_history(session_id):
    conn = sqlite3.connect("chat_history.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()