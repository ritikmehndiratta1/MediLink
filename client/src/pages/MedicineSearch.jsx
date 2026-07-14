import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { timeAgo } from "../lib/timeAgo";
import { ShieldIcon, MapPinIcon } from "../components/icons";
import posthog from "../lib/posthog";
import "./MedicineSearch.css";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "false", label: "Branded" },
  { value: "true", label: "Generic" },
];

export default function MedicineSearch() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = useCallback(
    async (overrideCoords) => {
      setLoading(true);
      setError("");
      const activeCoords = overrideCoords !== undefined ? overrideCoords : coords;
      try {
        const data = await api.searchMedicines({
          q,
          generic: typeFilter,
          verifiedOnly,
          lat: activeCoords?.lat,
          lng: activeCoords?.lng,
        });
        setResults(data.results);
        setSearched(true);
        posthog.capture("medicine_search", { q, generic: typeFilter, verifiedOnly, hasLocation: Boolean(activeCoords) });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [q, typeFilter, verifiedOnly, coords]
  );

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(next);
        runSearch(next);
      },
      () => setLocationError("Location permission denied. Showing results without distance sorting."),
      { timeout: 10000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch();
  }

  async function handleChat(result) {
    if (!token) {
      navigate("/login");
      return;
    }
    const data = await api.startConversation(
      { wholesalerId: result.wholesaler_id, medicineId: result.medicine_id },
      token
    );
    navigate(`/messages/${data.conversationId}`);
  }

  return (
    <section className="container medicine-search">
      <h1>Search medicines</h1>
      <p className="lead">Find nearby wholesalers with real, up-to-date stock.</p>

      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search by brand, generic name, or manufacturer..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="search-filters">
        <div className="filter-group">
          {TYPE_FILTERS.map((f) => (
            <label key={f.value} className={`filter-chip ${typeFilter === f.value ? "active" : ""}`}>
              <input
                type="radio"
                name="type-filter"
                value={f.value}
                checked={typeFilter === f.value}
                onChange={() => setTypeFilter(f.value)}
              />
              {f.label}
            </label>
          ))}
        </div>

        <label className="filter-chip">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified dealers only
        </label>

        <button type="button" className="btn btn-outline location-btn" onClick={useMyLocation}>
          <MapPinIcon /> {coords ? "Location set — sorted by distance" : "Use my location"}
        </button>
      </div>

      {locationError && <p className="form-error">{locationError}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="results">
        {searched && results.length === 0 && !loading && <p>No matching stock found nearby.</p>}

        {results.map((r) => (
          <div className="result-card" key={r.inventory_id}>
            <div className="result-main">
              <h3>
                {r.brand_name || r.generic_name}
                {r.brand_name && <span className="generic-name"> ({r.generic_name})</span>}
              </h3>
              <p className="result-meta">
                {r.manufacturer && `${r.manufacturer} · `}
                {r.dosage_form} · {r.strength} · {r.pack_size}
              </p>
            </div>

            <div className="result-wholesaler">
              <p className="wholesaler-name">
                {r.wholesaler_name}
                {r.verified && (
                  <span className="verified-badge">
                    <ShieldIcon /> Verified
                  </span>
                )}
              </p>
              <p className="result-meta">
                {r.city}, {r.state}
                {r.distance_km !== null && ` · ${r.distance_km.toFixed(1)} km away`}
                {r.delivery_available && " · Delivers"}
              </p>
              <p className="result-meta">
                Rs. {r.price ?? "—"} · Qty {r.quantity} · Updated {timeAgo(r.last_updated)}
              </p>
              {(!user || user.role === "RETAILER") && (
                <button type="button" className="btn btn-outline call-btn" onClick={() => handleChat(r)}>
                  Chat with wholesaler
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
