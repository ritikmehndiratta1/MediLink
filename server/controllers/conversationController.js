const pool = require("../config/db");
const { capture } = require("../config/posthog");

async function isParticipant(conversationId, userId) {
  const result = await pool.query(
    "SELECT retailer_id, wholesaler_id FROM conversations WHERE id = $1",
    [conversationId]
  );
  const convo = result.rows[0];
  if (!convo) return null;
  if (convo.retailer_id !== userId && convo.wholesaler_id !== userId) return false;
  return convo;
}

async function start(req, res) {
  const { wholesalerId, medicineId } = req.body;

  if (!wholesalerId || !medicineId) {
    return res.status(400).json({ success: false, error: "wholesalerId and medicineId are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM conversations WHERE retailer_id = $1 AND wholesaler_id = $2 AND medicine_id = $3",
      [req.user.userId, wholesalerId, medicineId]
    );

    let conversationId;
    let isNew = false;

    if (existing.rows.length > 0) {
      conversationId = existing.rows[0].id;
    } else {
      const names = await client.query(
        `SELECT
           (SELECT business_name FROM business_profiles WHERE user_id = $1) AS retailer_name,
           (SELECT business_name FROM business_profiles WHERE user_id = $2) AS wholesaler_name,
           (SELECT COALESCE(brand_name, generic_name) FROM medicines WHERE id = $3) AS medicine_name`,
        [req.user.userId, wholesalerId, medicineId]
      );
      const { retailer_name: retailerName, wholesaler_name: wholesalerName, medicine_name: medicineName } = names.rows[0];

      const created = await client.query(
        `INSERT INTO conversations (retailer_id, wholesaler_id, medicine_id) VALUES ($1, $2, $3) RETURNING id`,
        [req.user.userId, wholesalerId, medicineId]
      );
      conversationId = created.rows[0].id;
      isNew = true;

      await client.query(
        `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)`,
        [conversationId, req.user.userId, `${retailerName} is interested in buying ${medicineName} from ${wholesalerName}.`]
      );
    }

    await client.query("COMMIT");

    if (isNew) {
      capture({ distinctId: req.user.userId, event: "conversation_started", properties: { medicineId, wholesalerId } });
    }

    res.status(201).json({ success: true, conversationId });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to start conversation" });
  } finally {
    client.release();
  }
}

async function listMine(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.id, c.retailer_id, c.wholesaler_id, c.medicine_id, c.created_at,
              COALESCE(m.brand_name, m.generic_name) AS medicine_name,
              rp.business_name AS retailer_name,
              wp.business_name AS wholesaler_name,
              (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN medicines m ON m.id = c.medicine_id
       JOIN business_profiles rp ON rp.user_id = c.retailer_id
       JOIN business_profiles wp ON wp.user_id = c.wholesaler_id
       WHERE c.retailer_id = $1 OR c.wholesaler_id = $1
       ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, conversations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch conversations" });
  }
}

async function getMessages(req, res) {
  try {
    const convo = await isParticipant(req.params.id, req.user.userId);
    if (convo === null) return res.status(404).json({ success: false, error: "Conversation not found" });
    if (!convo) return res.status(403).json({ success: false, error: "Not part of this conversation" });

    const result = await pool.query(
      "SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
}

async function sendMessage(req, res) {
  const { body } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ success: false, error: "Message body is required" });
  }

  try {
    const convo = await isParticipant(req.params.id, req.user.userId);
    if (convo === null) return res.status(404).json({ success: false, error: "Conversation not found" });
    if (!convo) return res.status(403).json({ success: false, error: "Not part of this conversation" });

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)
       RETURNING id, sender_id, body, created_at`,
      [req.params.id, req.user.userId, body.trim()]
    );
    res.status(201).json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
}

module.exports = { start, listMine, getMessages, sendMessage };
