import { ShieldIcon, MapPinIcon, ChatIcon } from "../components/icons";
import "./StaticPage.css";

export default function AboutUs() {
  return (
    <section className="container static-page">
      <h1>About MediLink</h1>
      <p className="lead">
        MediLink connects verified medical retailers with verified wholesalers, so pharmacies can find
        the medicines they need from trusted suppliers nearby, without relying on outdated phone calls
        and static price lists.
      </p>

      <div className="static-grid">
        <div className="static-card">
          <ShieldIcon className="static-icon" />
          <h2>Verified by design</h2>
          <p>Every retailer and wholesaler on the platform is verified against their drug license before they can list or search.</p>
        </div>
        <div className="static-card">
          <MapPinIcon className="static-icon" />
          <h2>Built on proximity</h2>
          <p>Search surfaces nearby wholesalers first, so retailers can act quickly when stock is needed.</p>
        </div>
        <div className="static-card">
          <ChatIcon className="static-icon" />
          <h2>Conversations that matter</h2>
          <p>Chat is tied to a specific medicine inquiry, keeping every conversation organized and easy to follow up on.</p>
        </div>
      </div>
    </section>
  );
}
