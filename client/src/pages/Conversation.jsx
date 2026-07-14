import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { timeAgo } from "../lib/timeAgo";
import "./Messages.css";

const POLL_INTERVAL_MS = 4000;

export default function Conversation() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(() => {
    api.conversationMessages(id, token).then((data) => setMessages(data.messages));
  }, [id, token]);

  useEffect(() => {
    api.myConversations(token).then((data) => {
      setMeta(data.conversations.find((c) => c.id === id) || null);
    });
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [id, token, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(id, draft, token);
      setDraft("");
      loadMessages();
    } finally {
      setSending(false);
    }
  }

  const otherParty = meta && (user.role === "RETAILER" ? meta.wholesaler_name : meta.retailer_name);

  return (
    <section className="container conversation-page">
      <p>
        <Link to="/messages">&larr; All messages</Link>
      </p>
      <h1>{otherParty || "Conversation"}</h1>
      {meta && <p className="conversation-medicine">Re: {meta.medicine_name}</p>}

      <div className="message-thread">
        {messages.map((m) => (
          <div key={m.id} className={`message-bubble ${m.sender_id === user.id ? "mine" : "theirs"}`}>
            <p>{m.body}</p>
            <span className="message-time">{timeAgo(m.created_at)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="message-composer" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
