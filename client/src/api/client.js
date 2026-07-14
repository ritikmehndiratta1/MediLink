const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Render's own free-tier wake-up sequence alone can take 40s+ before the app
// process even starts, on top of whatever the request itself needs — so this
// has to be generous or a real cold-start request gets mistaken for a hang.
const REQUEST_TIMEOUT_MS = 90000;

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

function toQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/api/auth/me", { token }),
  createTicket: (payload, token) => request("/api/tickets", { method: "POST", body: payload, token }),
  myTickets: (token) => request("/api/tickets/mine", { token }),

  searchMedicines: (params) => request(`/api/medicines/search${toQueryString(params)}`),
  listMedicines: () => request("/api/medicines"),
  createMedicine: (payload, token) => request("/api/medicines", { method: "POST", body: payload, token }),
  deleteMedicine: (id, token) => request(`/api/medicines/${id}`, { method: "DELETE", token }),

  myInventory: (token) => request("/api/inventory/mine", { token }),
  upsertInventory: (payload, token) => request("/api/inventory", { method: "POST", body: payload, token }),
  deleteInventoryItem: (id, token) => request(`/api/inventory/${id}`, { method: "DELETE", token }),

  adminListBusinesses: (token) => request("/api/admin/businesses", { token }),
  adminSetVerified: (id, verified, token) =>
    request(`/api/admin/businesses/${id}/verify`, { method: "PATCH", body: { verified }, token }),
  adminDeleteBusiness: (id, token) => request(`/api/admin/businesses/${id}`, { method: "DELETE", token }),
  adminListTickets: (token) => request("/api/admin/tickets", { token }),
  adminUpdateTicketStatus: (id, status, token) =>
    request(`/api/admin/tickets/${id}`, { method: "PATCH", body: { status }, token }),
  adminAnalytics: (token) => request("/api/admin/analytics", { token }),

  startConversation: (payload, token) => request("/api/conversations", { method: "POST", body: payload, token }),
  myConversations: (token) => request("/api/conversations/mine", { token }),
  conversationMessages: (id, token) => request(`/api/conversations/${id}/messages`, { token }),
  sendMessage: (id, body, token) =>
    request(`/api/conversations/${id}/messages`, { method: "POST", body: { body }, token }),
};
