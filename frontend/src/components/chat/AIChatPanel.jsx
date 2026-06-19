import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { useAuth } from "../../context/AuthContext";
import { chatAPI } from "../../services/api";

const ROLE_META = {
  judge: {
    label: "Judge Assistant",
    color: "#000080",
    bg: "#000080",
    icon: "pi-star",
  },
  admin: {
    label: "Admin Assistant",
    color: "#7B2D8B",
    bg: "#7B2D8B",
    icon: "pi-shield",
  },
  writer: {
    label: "Writer Assistant",
    color: "#138808",
    bg: "#138808",
    icon: "pi-file-edit",
  },
};

const SUGGESTIONS = {
  judge: [
    "How many hearings do I have today?",
    "Which case is my highest priority?",
    "Which cases have overstay alerts?",
    "Show me recent adjournments.",
  ],
  admin: [
    "How many total cases are in the system?",
    "Which cases have overstay alerts?",
    "How many users are registered?",
    "Show me today's system statistics.",
  ],
  writer: [
    "How many cases have I registered?",
    "Show me my most recent cases.",
    "Which of my cases are still active?",
    "What stage are my cases at?",
  ],
};

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`chat-bubble-wrap ${isUser ? "chat-user" : "chat-ai"}`}>
      {!isUser && (
        <div className="chat-avatar-ai">
          <i className="pi pi-microchip-ai" />
        </div>
      )}
      <div
        className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}
      >
        {msg.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="chat-bubble-wrap chat-ai">
      <div className="chat-avatar-ai">
        <i className="pi pi-microchip-ai" />
      </div>
      <div className="chat-bubble chat-bubble-ai chat-typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

export default function AIChatPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || "writer";
  const meta = ROLE_META[role] || ROLE_META.writer;
  const suggestions = SUGGESTIONS[role] || SUGGESTIONS.writer;

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setError("");

      const userMsg = { role: "user", content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      // History for Ollama (exclude the new user msg, it will be added by backend)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await chatAPI.send({
          message: msg,
          role: role,
          user_id: user?.user_id,
          judge_id: user?.judge_id,
          history,
        });
        const aiMsg = {
          role: "assistant",
          content: res.data.reply || "(no response)",
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errText =
          err.response?.data?.error || "Could not reach the AI assistant.";
        setError(errText);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${errText}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, messages, loading, role, user],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  const showEmpty = messages.length === 0 && !loading;

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        className={`chat-fab ${open ? "chat-fab-open" : ""}`}
        style={{ background: meta.bg }}
        onClick={() => setOpen((v) => !v)}
        title="AI Assistant"
        aria-label="Open AI Chat Assistant"
      >
        <i className={`pi ${open ? "pi-times" : "pi-microchip-ai"}`} />
        {!open && <span className="chat-fab-label">AI</span>}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="chat-panel"
          role="dialog"
          aria-label="AI Chat Assistant"
        >
          {/* Header */}
          <div className="chat-header" style={{ background: meta.bg }}>
            <div className="chat-header-info">
              <i className={`pi ${meta.icon} chat-header-icon`} />
              <div>
                <div className="chat-header-title">{meta.label}</div>
                <div className="chat-header-sub">
                  Powered by Qwen2.5 · Personalized for{" "}
                  {user?.name?.split(" ")[0]}
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              {messages.length > 0 && (
                <button
                  className="chat-icon-btn"
                  onClick={clearChat}
                  title="Clear conversation"
                >
                  <i className="pi pi-trash" />
                </button>
              )}
              <button
                className="chat-icon-btn"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <i className="pi pi-times" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {showEmpty && (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <i
                    className={`pi ${meta.icon}`}
                    style={{ color: meta.color }}
                  />
                </div>
                <p className="chat-empty-title">
                  Hello, {user?.name?.split(" ")[0]}!
                </p>
                <p className="chat-empty-sub">
                  I have access to your{" "}
                  {role === "judge"
                    ? "cases, hearings & priorities"
                    : role === "admin"
                      ? "system data & analytics"
                      : "registered cases & filings"}
                  . Ask me anything.
                </p>
                <div className="chat-suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className="chat-suggestion-chip"
                      style={{ borderColor: meta.color, color: meta.color }}
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatBubble key={i} msg={m} />
            ))}

            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <InputTextarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your cases, hearings, priorities…"
              autoResize
              rows={1}
              className="chat-input"
              disabled={loading}
              style={{ maxHeight: 120 }}
            />
            <Button
              icon="pi pi-send"
              rounded
              disabled={!input.trim() || loading}
              loading={loading}
              onClick={() => sendMessage()}
              className="chat-send-btn"
              style={{ background: meta.bg, border: "none" }}
              aria-label="Send message"
            />
          </div>
        </div>
      )}
    </>
  );
}
