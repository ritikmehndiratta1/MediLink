import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="navbar-logo">MediLink</span>
          <p>Connecting verified medical retailers and wholesalers.</p>
        </div>

        <nav className="footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/connect">Connect</Link>
          <Link to="/query">Query</Link>
        </nav>

        <p className="footer-copy">&copy; {new Date().getFullYear()} MediLink. All rights reserved.</p>
      </div>
    </footer>
  );
}
