const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Generous enough to survive a Render free-tier cold start (can take 30-50s+
// to spin up an idle service) without giving up on a request that would have
// otherwise succeeded.
const REQUEST_TIMEOUT_MS = 45000;

async function request(path, { method = "GET", body, token } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.", { cause: err });
    }
    throw new Error("Could not reach the server. Please check your connection and try again.", { cause: err });
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),
  createTicket: (payload, token) => request("/api/tickets", { method: "POST", body: payload, token }),
  myTickets: (token) => request("/api/tickets/mine", { token }),
};
