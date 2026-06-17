import { useState, useEffect, useRef } from "react";
import "./App.css";
 
const BACKEND = "";
const SESSION_KEY = "chatbot_session_id";
 
const SUGGESTIONS = [
  "Explain how the internet works",
  "Write a Python function to add two numbers",
  "What is React.js used for?",
  "Give me tips for a coding interview",
];
 
function getOrCreateSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "session_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
 
function niceTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
 
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [sessionId] = useState(getOrCreateSession);
  const bottomRef = useRef(null);
 
  useEffect(() => {
    fetch(`${BACKEND}/history/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});
  }, [sessionId]);
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
 
  const sendMessage = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isTyping) return;
 
    setInput("");
    setError("");
 
    const updated = [
      ...messages,
      { role: "user", content: text, timestamp: new Date().toISOString() },
    ];
    setMessages(updated);
    setIsTyping(true);
 
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
 
      const data = await res.json();
 
      if (data.reply) {
        setMessages([
          ...updated,
          { role: "assistant", content: data.reply, timestamp: new Date().toISOString() },
        ]);
      } else {
        setError("Got a response but no reply. Check if your Gemini API key is correct.");
      }
    } catch (err) {
      // Backend not available
    } finally {
      setIsTyping(false);
    }
  };
 
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
 
  const clearChat = async () => {
    await fetch(`${BACKEND}/clear/${sessionId}`, { method: "DELETE" });
    setMessages([]);
    setError("");
  };
 
  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <div className="bot-avatar">🤖</div>
          <div className="header-info">
            <h1>AI Assistant</h1>
            <p><span className="online-dot" />Powered by Google Gemini</p>
          </div>
        </div>
        <button className="clear-btn" onClick={clearChat}>
          Clear Chat
        </button>
      </div>
 
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Ask me anything!</h3>
            <p>I'm powered by Google Gemini AI. Try one of the suggestions below.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="msg-icon">
                {msg.role === "user" ? "👤" : "🤖"}
              </div>
              <div>
                <div className="msg-bubble">{msg.content}</div>
                <div className="msg-time">{niceTime(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}
 
        {isTyping && (
          <div className="typing-wrap">
            <div className="msg-icon" style={{width:32,height:32,borderRadius:"50%",background:"#252540",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🤖</div>
            <div className="typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}
 
        <div ref={bottomRef} />
      </div>
 
      {messages.length === 0 && (
        <div className="suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="chip" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
 
      {error && <div className="error-bar">⚠️ {error}</div>}
 
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={isTyping}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
          title="Send message"
        >
          &#9654;
        </button>
      </div>
    </div>
  );
}
