const pool = require("../config/db");

async function listBusinesses(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.verified, u.created_at,
              b.business_name, b.drug_license, b.phone, b.city, b.state
       FROM users u
       LEFT JOIN business_profiles b ON b.user_id = u.id
       WHERE u.role IN ('RETAILER', 'WHOLESALER')
       ORDER BY u.verified ASC, u.created_at DESC`
    );
    res.json({ success: true, businesses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch businesses" });
  }
}

async function setVerified(req, res) {
  const { verified } = req.body;

  if (typeof verified !== "boolean") {
    return res.status(400).json({ success: false, error: "verified must be a boolean" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET verified = $1, updated_at = NOW()
       WHERE id = $2 AND role IN ('RETAILER', 'WHOLESALER')
       RETURNING id, email, role, verified`,
      [verified, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update verification status" });
  }
}

async function deleteUser(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role IN ('RETAILER', 'WHOLESALER') RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
}

async function listTickets(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, email, category, subject, message, status, created_at
       FROM tickets
       ORDER BY
         CASE status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'RESOLVED' THEN 2 ELSE 3 END,
         created_at DESC`
    );
    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch tickets" });
  }
}

async function updateTicketStatus(req, res) {
  const { status } = req.body;
  const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: `status must be one of ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const result = await pool.query(
      `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update ticket" });
  }
}

async function analyticsSummary(req, res) {
  try {
    const [users, tickets, catalog] = await Promise.all([
      pool.query(
        `SELECT role, verified, COUNT(*)::int AS count
         FROM users WHERE role IN ('RETAILER', 'WHOLESALER')
         GROUP BY role, verified`
      ),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status`),
      pool.query(
        `SELECT (SELECT COUNT(*) FROM medicines)::int AS medicine_count,
                (SELECT COUNT(*) FROM inventory)::int AS inventory_count`
      ),
    ]);

    res.json({
      success: true,
      users: users.rows,
      tickets: tickets.rows,
      medicineCount: catalog.rows[0].medicine_count,
      inventoryCount: catalog.rows[0].inventory_count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
}

module.exports = { listBusinesses, setVerified, deleteUser, listTickets, updateTicketStatus, analyticsSummary };
