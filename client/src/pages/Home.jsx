import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section id="center">
      <div>
        <h1>MediLink</h1>
        <p>Connect verified medical retailers with verified wholesalers.</p>
      </div>
      <div>
        <Link to="/signup">
          <button type="button">Get started</button>
        </Link>
        <Link to="/login">
          <button type="button">Log in</button>
        </Link>
      </div>
    </section>
  );
}
