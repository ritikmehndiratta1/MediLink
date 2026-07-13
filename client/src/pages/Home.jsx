import { Link } from "react-router-dom";
import { SearchIcon, MapPinIcon, ChatIcon, StarIcon, ShieldIcon, BoxIcon } from "../components/icons";
import "./Home.css";

const FEATURES = [
  {
    icon: SearchIcon,
    title: "Medicine search",
    desc: "Search by brand, generic name, manufacturer, strength, or dosage form to find exactly what you need.",
  },
  {
    icon: MapPinIcon,
    title: "Nearby wholesalers",
    desc: "See wholesalers within a 20-30km radius, sorted by distance so you can act fast.",
  },
  {
    icon: ChatIcon,
    title: "Contextual chat",
    desc: "Every conversation starts from a specific medicine inquiry, so nothing gets lost.",
  },
  {
    icon: StarIcon,
    title: "Ratings you can trust",
    desc: "Ratings only come from businesses that have actually interacted, cutting down on fake reviews.",
  },
  {
    icon: ShieldIcon,
    title: "Verified profiles",
    desc: "Every retailer and wholesaler is verified against their drug license before going live.",
  },
  {
    icon: BoxIcon,
    title: "Live inventory",
    desc: "Wholesaler stock is timestamped, so you know if a listing was updated minutes or days ago.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero container">
        <h1>
          Medical Supplies,
          <br />
          Delivered by Trust.
        </h1>
        <p className="lead">
          MediLink connects verified retailers with verified wholesalers by medicine availability and
          proximity — so you spend less time calling around and more time serving customers.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">
            Get started
          </Link>
          <Link to="/about" className="btn btn-outline">
            Learn more
          </Link>
        </div>

        <div className="hero-cards">
          <div className="hero-card">
            <ShieldIcon />
            Verified businesses
          </div>
          <div className="hero-card">
            <MapPinIcon />
            20-30km radius search
          </div>
          <div className="hero-card">
            <ChatIcon />
            Contextual chat
          </div>
          <div className="hero-card">
            <StarIcon />
            Earned ratings
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="how-it-works-tracks">
          <div className="track">
            <h3>For retailers</h3>
            <ol>
              <li>
                <span className="step-number">1</span>
                <span>Register your store and get your drug license verified.</span>
              </li>
              <li>
                <span className="step-number">2</span>
                <span>Search for medicines by name, salt, or manufacturer.</span>
              </li>
              <li>
                <span className="step-number">3</span>
                <span>Contact a nearby wholesaler and place your order.</span>
              </li>
            </ol>
          </div>
          <div className="track">
            <h3>For wholesalers</h3>
            <ol>
              <li>
                <span className="step-number">1</span>
                <span>Register your business and get your drug license verified.</span>
              </li>
              <li>
                <span className="step-number">2</span>
                <span>List and keep your inventory up to date.</span>
              </li>
              <li>
                <span className="step-number">3</span>
                <span>Connect with retailers searching nearby.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="feature-grid-section">
        <h2>Everything you need to trade with confidence</h2>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
