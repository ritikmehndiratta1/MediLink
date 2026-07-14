import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { timeAgo } from "../lib/timeAgo";
import "./StaticPage.css";
import "./Messages.css";

export default function Messages() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState(null);

  useEffect(() => {
    api.myConversations(token).then((data) => setConversations(data.conversations));
  }, [token]);

  return (
    <section className="container static-page">
      <h1>Messages</h1>

      {conversations === null && <p>Loading...</p>}
      {conversations?.length === 0 && <p>No conversations yet. Start one from a medicine search result.</p>}

      <div className="conversation-list">
        {conversations?.map((c) => {
          const otherParty = user.role === "RETAILER" ? c.wholesaler_name : c.retailer_name;
          return (
            <Link className="conversation-row" to={`/messages/${c.id}`} key={c.id}>
              <div>
                <p className="conversation-party">{otherParty}</p>
                <p className="conversation-medicine">{c.medicine_name}</p>
              </div>
              <div className="conversation-preview">
                <p>{c.last_message || "No messages yet"}</p>
                {c.last_message_at && <p className="conversation-time">{timeAgo(c.last_message_at)}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
