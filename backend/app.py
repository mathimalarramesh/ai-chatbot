# app.py — the main Flask web server
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from database import init_db, save_message, get_history, clear_history
import uuid
 
# Create the Flask app
app = Flask(__name__)
 
# CORS lets React app talk to Flask
CORS(app)
load_dotenv("../api.env")
gemini_api_key = os.getenv("GEMINI_API_KEY")
 
# Configure Gemini with new package
client = genai.Client(api_key=gemini_api_key)
 
# Initialize database
init_db()
 
 
# ─── ROUTE 1: Chat ─────────────────────────────────────────────
 
@app.route("/chat", methods=["POST"])
def chat():
    # Get data from React
    data = request.json
    user_message = data.get("message", "")
    session_id = data.get("session_id", str(uuid.uuid4()))
 
    # Check if message is empty
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
 
    # Save user message
    save_message(session_id, "user", user_message)
 
    # Get previous history
    history = get_history(session_id)
 
    # Build conversation history
    history_text = ""
    for h in history[:-1]:
        history_text += f"{h['role'].upper()}: {h['content']}\n"
 
    # Create prompt
    prompt = f"{history_text}USER: {user_message}\nASSISTANT:"
 
    # Generate AI response using new package
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=prompt
    )
    ai_reply = response.text
 
    # Save AI response
    save_message(session_id, "assistant", ai_reply)
 
    # Return response
    return jsonify({
        "reply": ai_reply,
        "session_id": session_id
    })
 
 
# ─── ROUTE 2: Get History ─────────────────────────────────────
 
@app.route("/history/<session_id>", methods=["GET"])
def history(session_id):
    return jsonify(get_history(session_id))
 
 
# ─── ROUTE 3: Clear History ───────────────────────────────────
 
@app.route("/clear/<session_id>", methods=["DELETE"])
def clear(session_id):
    clear_history(session_id)
    return jsonify({"message": "History cleared"})
 
 
# ─── ROUTE 4: Health Check ────────────────────────────────────
 
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "message": "Backend is alive!"
    })
 
 
# Start server
if __name__ == "__main__":
    app.run(debug=True, port=5000)
 