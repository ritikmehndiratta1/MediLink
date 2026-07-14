import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login({ email, password });
      navigate(loggedInUser.role === "RETAILER" ? "/search" : "/");
    } catch (err) {
      navigate("/", {
        state: { banner: { type: "error", message: err.message || "Incorrect email or password" } },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="auth">
      <h1>Log in</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Logging in... (can take up to a minute if the server was asleep)" : "Log in"}
        </button>
      </form>

      <p>
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
