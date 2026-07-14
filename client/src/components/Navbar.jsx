import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          MediLink
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/search">Search Medicines</NavLink>
          {user?.role === "WHOLESALER" && <NavLink to="/inventory">My Inventory</NavLink>}
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/connect">Connect</NavLink>
          <NavLink to="/query">Query</NavLink>
        </nav>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="btn btn-outline">
                {user.role === "ADMIN" ? "Admin" : "Dashboard"}
              </Link>
              <button type="button" className="btn btn-primary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
