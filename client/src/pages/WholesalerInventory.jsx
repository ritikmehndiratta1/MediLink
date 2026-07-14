import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { timeAgo } from "../lib/timeAgo";
import "./StaticPage.css";

export default function WholesalerInventory() {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [medicineId, setMedicineId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = useCallback(() => {
    api.myInventory(token).then((data) => setInventory(data.inventory));
  }, [token]);

  useEffect(() => {
    api.listMedicines().then((data) => {
      setMedicines(data.medicines);
      if (data.medicines.length > 0) setMedicineId(data.medicines[0].id);
    });
    loadInventory();
  }, [loadInventory]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.upsertInventory({ medicineId, price: price || null, quantity: Number(quantity) }, token);
      setPrice("");
      setQuantity("");
      loadInventory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await api.deleteInventoryItem(id, token);
    loadInventory();
  }

  return (
    <section className="container static-page">
      <h1>My inventory</h1>
      <p className="lead">Keep your stock and prices current so retailers see accurate availability.</p>

      <div id="auth" style={{ margin: "0 0 40px", padding: 0, maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <label>
            Medicine
            <select value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand_name || m.generic_name} — {m.strength} {m.dosage_form} ({m.pack_size})
                </option>
              ))}
            </select>
          </label>
          <label>
            Price (Rs.)
            <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            Quantity in stock
            <input type="number" min={0} required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : "Add / update stock"}
          </button>
        </form>
      </div>

      <h2>Current listings</h2>
      {inventory.length === 0 ? (
        <p>No inventory listed yet.</p>
      ) : (
        <div className="static-grid">
          {inventory.map((item) => (
            <div className="static-card" key={item.id}>
              <h2>{item.brand_name || item.generic_name}</h2>
              <p>
                {item.strength} {item.dosage_form} · {item.pack_size}
              </p>
              <p>Rs. {item.price ?? "—"} · Qty {item.quantity}</p>
              <p>Updated {timeAgo(item.last_updated)}</p>
              <button type="button" className="btn btn-outline" onClick={() => handleDelete(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
