import "./Banner.css";

export default function Banner({ type = "success", message, onDismiss }) {
  if (!message) return null;

  return (
    <div className={`banner banner-${type}`} role="status">
      <span>{message}</span>
      <button type="button" className="banner-close" onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
