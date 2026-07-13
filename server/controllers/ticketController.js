const pool = require("../config/db");
const { capture } = require("../config/posthog");

const CATEGORIES = ["TECHNICAL", "VERIFICATION", "ABUSE", "OTHER"];

async function createTicket(req, res) {
  const { email, category, subject, message } = req.body;

  if (!email || !category || !subject || !message) {
    return res.status(400).json({ success: false, error: "email, category, subject and message are required" });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: `category must be one of ${CATEGORIES.join(", ")}` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (user_id, email, category, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, category, subject, status, created_at`,
      [req.user?.userId || null, email, category, subject, message]
    );

    const ticket = result.rows[0];

    capture({
      distinctId: req.user?.userId || email,
      event: "ticket_submitted",
      properties: { category, ticketId: ticket.id },
    });

    return res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to submit ticket" });
  }
}

async function listMine(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, category, subject, message, status, created_at
       FROM tickets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    return res.json({ success: true, tickets: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to fetch tickets" });
  }
}

module.exports = { createTicket, listMine };
