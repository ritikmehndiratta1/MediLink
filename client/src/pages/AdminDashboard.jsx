import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import "./AdminDashboard.css";

const TABS = ["Businesses", "Tickets", "Catalog", "Analytics"];
const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const DOSAGE_FORMS = ["TABLET", "SYRUP", "INJECTION", "CAPSULE", "OINTMENT", "DROPS", "OTHER"];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("Businesses");

  return (
    <section className="container admin-dashboard">
      <h1>Admin</h1>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Businesses" && <BusinessesTab token={token} />}
      {tab === "Tickets" && <TicketsTab token={token} />}
      {tab === "Catalog" && <CatalogTab token={token} />}
      {tab === "Analytics" && <AnalyticsTab token={token} />}
    </section>
  );
}

function BusinessesTab({ token }) {
  const [businesses, setBusinesses] = useState([]);

  const load = useCallback(() => {
    api.adminListBusinesses(token).then((data) => setBusinesses(data.businesses));
  }, [token]);

  useEffect(load, [load]);

  async function toggleVerified(b) {
    await api.adminSetVerified(b.id, !b.verified, token);
    load();
  }

  async function remove(b) {
    if (!confirm(`Delete ${b.business_name || b.email}? This cannot be undone.`)) return;
    await api.adminDeleteBusiness(b.id, token);
    load();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Role</th>
            <th>License</th>
            <th>Location</th>
            <th>Verified</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((b) => (
            <tr key={b.id}>
              <td>
                {b.business_name}
                <div className="admin-subtext">{b.email}</div>
              </td>
              <td>{b.role}</td>
              <td>{b.drug_license}</td>
              <td>
                {b.city}, {b.state}
              </td>
              <td>{b.verified ? "Verified" : "Pending"}</td>
              <td className="admin-actions">
                <button className="btn btn-outline" onClick={() => toggleVerified(b)}>
                  {b.verified ? "Unverify" : "Verify"}
                </button>
                <button className="btn btn-outline" onClick={() => remove(b)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {businesses.length === 0 && <p>No retailers or wholesalers yet.</p>}
    </div>
  );
}

function TicketsTab({ token }) {
  const [tickets, setTickets] = useState([]);

  const load = useCallback(() => {
    api.adminListTickets(token).then((data) => setTickets(data.tickets));
  }, [token]);

  useEffect(load, [load]);

  async function updateStatus(id, status) {
    await api.adminUpdateTicketStatus(id, status, token);
    load();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.category}</td>
              <td>{t.subject}</td>
              <td className="admin-message">{t.message}</td>
              <td>{t.email}</td>
              <td>
                <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.length === 0 && <p>No tickets submitted yet.</p>}
    </div>
  );
}

function CatalogTab({ token }) {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    brandName: "",
    genericName: "",
    manufacturer: "",
    dosageForm: "TABLET",
    strength: "",
    packSize: "",
    isGeneric: false,
  });
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.listMedicines().then((data) => setMedicines(data.medicines));
  }, []);

  useEffect(load, [load]);

  function update(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createMedicine(form, token);
      setForm({ brandName: "", genericName: "", manufacturer: "", dosageForm: "TABLET", strength: "", packSize: "", isGeneric: false });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this medicine from the catalog?")) return;
    await api.deleteMedicine(id, token);
    load();
  }

  return (
    <div>
      <div id="auth" style={{ margin: "0 0 32px", padding: 0, maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <label>
            Brand name (leave blank for a generic-only listing)
            <input value={form.brandName} onChange={update("brandName")} />
          </label>
          <label>
            Generic / salt name
            <input required value={form.genericName} onChange={update("genericName")} />
          </label>
          <label>
            Manufacturer
            <input value={form.manufacturer} onChange={update("manufacturer")} />
          </label>
          <label>
            Dosage form
            <select value={form.dosageForm} onChange={update("dosageForm")}>
              {DOSAGE_FORMS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Strength
            <input value={form.strength} onChange={update("strength")} placeholder="e.g. 500mg" />
          </label>
          <label>
            Pack size
            <input value={form.packSize} onChange={update("packSize")} placeholder="e.g. Strip of 10" />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.isGeneric} onChange={update("isGeneric")} />
            This is a generic-only listing
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary">
            Add medicine
          </button>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Manufacturer</th>
              <th>Form</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.brand_name || m.generic_name}
                  {m.brand_name && <div className="admin-subtext">{m.generic_name}</div>}
                </td>
                <td>{m.manufacturer || "—"}</td>
                <td>
                  {m.strength} {m.dosage_form} ({m.pack_size})
                </td>
                <td>{m.is_generic ? "Generic" : "Branded"}</td>
                <td className="admin-actions">
                  <button className="btn btn-outline" onClick={() => remove(m.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab({ token }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.adminAnalytics(token).then(setData);
  }, [token]);

  if (!data) return <p>Loading...</p>;

  const totalRetailers = data.users.filter((u) => u.role === "RETAILER").reduce((sum, u) => sum + u.count, 0);
  const totalWholesalers = data.users.filter((u) => u.role === "WHOLESALER").reduce((sum, u) => sum + u.count, 0);
  const verifiedCount = data.users.filter((u) => u.verified).reduce((sum, u) => sum + u.count, 0);

  return (
    <div>
      <div className="static-grid">
        <div className="static-card">
          <h2>{totalRetailers}</h2>
          <p>Retailers registered</p>
        </div>
        <div className="static-card">
          <h2>{totalWholesalers}</h2>
          <p>Wholesalers registered</p>
        </div>
        <div className="static-card">
          <h2>{verifiedCount}</h2>
          <p>Verified businesses</p>
        </div>
        <div className="static-card">
          <h2>{data.medicineCount}</h2>
          <p>Medicines in catalog</p>
        </div>
        <div className="static-card">
          <h2>{data.inventoryCount}</h2>
          <p>Active inventory listings</p>
        </div>
        <div className="static-card">
          <h2>{data.tickets.reduce((sum, t) => sum + t.count, 0)}</h2>
          <p>Total support tickets</p>
        </div>
      </div>

      <h2 style={{ marginTop: 32 }}>Tickets by status</h2>
      <ul>
        {data.tickets.map((t) => (
          <li key={t.status}>
            {t.status}: {t.count}
          </li>
        ))}
      </ul>

      <div className="analytics-posthog-note">
        <h2>Page visits, clicks, and session behavior</h2>
        <p>
          This data is already being captured by PostHog (autocaptured pageviews, clicks, and sessions
          across the site). Rather than duplicate that here, use your PostHog project directly for
          funnels, click heatmaps, session recordings, and time-on-page — it's purpose-built for this and
          already wired into the site.
        </p>
        <a className="btn btn-outline" href="https://posthog.com" target="_blank" rel="noreferrer">
          Open PostHog
        </a>
      </div>
    </div>
  );
}
