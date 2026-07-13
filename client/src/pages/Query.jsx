import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import posthog from "../lib/posthog";
import "./StaticPage.css";

const CATEGORIES = [
  { value: "TECHNICAL", label: "Technical issue" },
  { value: "VERIFICATION", label: "Account verification issue" },
  { value: "ABUSE", label: "Report abuse" },
  { value: "OTHER", label: "Other" },
];

export default function Query() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || "",
    category: "TECHNICAL",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!token) return;
    api
      .myTickets(token)
      .then((data) => setTickets(data.tickets))
      .catch(() => {});
  }, [token, success]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    posthog.capture("ticket_submit_clicked", { category: form.category });
    try {
      await api.createTicket(form, token);
      setSuccess(true);
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container static-page">
      <h1>Submit a query</h1>
      <p className="lead">
        Technical issues, account verification problems, or abuse reports — tell us what's going on and
        we'll follow up by email.
      </p>

      <div id="auth" style={{ margin: 0, padding: 0, maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" required value={form.email} onChange={update("email")} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={update("category")}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <input required value={form.subject} onChange={update("subject")} />
          </label>
          <label>
            Message
            <textarea required rows={5} value={form.message} onChange={update("message")} />
          </label>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">Ticket submitted. We'll be in touch by email.</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit ticket"}
          </button>
        </form>
      </div>

      {token && (
        <div style={{ marginTop: 48 }}>
          <h2>My tickets</h2>
          {tickets.length === 0 ? (
            <p>No tickets submitted yet.</p>
          ) : (
            <div className="static-grid">
              {tickets.map((t) => (
                <div className="static-card" key={t.id}>
                  <h2>{t.subject}</h2>
                  <p>{t.category}</p>
                  <p>Status: {t.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
