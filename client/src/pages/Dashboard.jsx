import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <section id="dashboard">
      <h1>Welcome, {user?.email}</h1>
      <p>Role: {user?.role}</p>
      <p>Verification status: {user?.verified ? "Verified" : "Pending verification"}</p>
      <button type="button" className="btn btn-outline" onClick={logout}>
        Log out
      </button>
    </section>
  );
}
