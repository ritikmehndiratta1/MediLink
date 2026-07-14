const pool = require("../config/db");

async function listMine(req, res) {
  try {
    const result = await pool.query(
      `SELECT i.id, i.price, i.quantity, i.last_updated,
              m.id AS medicine_id, m.brand_name, m.generic_name, m.dosage_form, m.strength, m.pack_size
       FROM inventory i
       JOIN medicines m ON m.id = i.medicine_id
       WHERE i.wholesaler_id = $1
       ORDER BY i.last_updated DESC`,
      [req.user.userId]
    );
    res.json({ success: true, inventory: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch inventory" });
  }
}

async function upsert(req, res) {
  const { medicineId, price, quantity } = req.body;

  if (!medicineId || quantity === undefined) {
    return res.status(400).json({ success: false, error: "medicineId and quantity are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inventory (wholesaler_id, medicine_id, price, quantity, last_updated)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (wholesaler_id, medicine_id)
       DO UPDATE SET price = EXCLUDED.price, quantity = EXCLUDED.quantity, last_updated = NOW()
       RETURNING id, medicine_id, price, quantity, last_updated`,
      [req.user.userId, medicineId, price || null, quantity]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update inventory" });
  }
}

async function remove(req, res) {
  try {
    await pool.query("DELETE FROM inventory WHERE id = $1 AND wholesaler_id = $2", [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to remove inventory item" });
  }
}

module.exports = { listMine, upsert, remove };
