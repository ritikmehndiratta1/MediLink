import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import posthog from "../lib/posthog";

const initialForm = {
  email: "",
  password: "",
  role: "RETAILER",
  businessName: "",
  contactName: "",
  drugLicense: "",
  gstNumber: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  businessHours: "",
  deliveryAvailable: false,
  deliveryRadiusKm: "",
};

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    posthog.capture("signup_submitted", { role: form.role });
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="auth">
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit}>
        <label>
          I am a
          <select value={form.role} onChange={update("role")}>
            <option value="RETAILER">Retailer</option>
            <option value="WHOLESALER">Wholesaler</option>
          </select>
        </label>

        <label>
          Email
          <input type="email" required value={form.email} onChange={update("email")} />
        </label>
        <label>
          Password
          <input type="password" required minLength={8} value={form.password} onChange={update("password")} />
        </label>

        <label>
          {form.role === "RETAILER" ? "Store name" : "Company name"}
          <input required value={form.businessName} onChange={update("businessName")} />
        </label>
        <label>
          {form.role === "RETAILER" ? "Owner name" : "Warehouse contact"}
          <input value={form.contactName} onChange={update("contactName")} />
        </label>
        <label>
          Drug license number
          <input required value={form.drugLicense} onChange={update("drugLicense")} />
        </label>
        <label>
          GST number
          <input value={form.gstNumber} onChange={update("gstNumber")} />
        </label>
        <label>
          Phone
          <input required value={form.phone} onChange={update("phone")} />
        </label>

        <label>
          Address
          <input required value={form.address} onChange={update("address")} />
        </label>
        <label>
          City
          <input required value={form.city} onChange={update("city")} />
        </label>
        <label>
          State
          <input required value={form.state} onChange={update("state")} />
        </label>
        <label>
          Pincode
          <input value={form.pincode} onChange={update("pincode")} />
        </label>
        <label>
          Business hours
          <input placeholder="e.g. 9 AM - 9 PM" value={form.businessHours} onChange={update("businessHours")} />
        </label>

        {form.role === "WHOLESALER" && (
          <>
            <label className="checkbox">
              <input type="checkbox" checked={form.deliveryAvailable} onChange={update("deliveryAvailable")} />
              Delivery available
            </label>
            <label>
              Delivery radius (km)
              <input type="number" min={0} value={form.deliveryRadiusKm} onChange={update("deliveryRadiusKm")} />
            </label>
          </>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
