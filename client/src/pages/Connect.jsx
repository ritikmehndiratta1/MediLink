import { Link } from "react-router-dom";
import "./StaticPage.css";

export default function Connect() {
  return (
    <section className="container static-page">
      <h1>Connect with us</h1>
      <p className="lead">
        Have a partnership question, press inquiry, or something outside a support ticket? Reach out
        directly.
      </p>

      <div className="static-grid">
        <div className="static-card">
          <h2>Email</h2>
          {/* Placeholder contact details — replace with MediLink's real inbox */}
          <p>support@medilink.example</p>
        </div>
        <div className="static-card">
          <h2>Phone</h2>
          <p>+91 00000 00000</p>
        </div>
        <div className="static-card">
          <h2>Have an account issue instead?</h2>
          <p>
            Use the <Link to="/query">Query</Link> page to submit a support ticket and track its status.
          </p>
        </div>
      </div>
    </section>
  );
}
