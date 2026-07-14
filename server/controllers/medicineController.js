const pool = require("../config/db");

const DOSAGE_FORMS = ["TABLET", "SYRUP", "INJECTION", "CAPSULE", "OINTMENT", "DROPS", "OTHER"];
const DEFAULT_RADIUS_KM = 30;

// Amazon-style catalog search: matches brand/generic/manufacturer name,
// optional generic-vs-branded and verified-dealer-only filters, and sorts by
// distance to the searcher when a location is supplied (nulls-last so
// listings without a geocoded wholesaler still show up, just at the end).
async function search(req, res) {
  const { q, generic, verifiedOnly, lat, lng, radiusKm } = req.query;

  const conditions = ["i.quantity > 0"];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(m.brand_name ILIKE $${idx} OR m.generic_name ILIKE $${idx} OR m.manufacturer ILIKE $${idx})`);
  }

  if (generic === "true" || generic === "false") {
    params.push(generic === "true");
    conditions.push(`m.is_generic = $${params.length}`);
  }

  if (verifiedOnly === "true") {
    conditions.push("u.verified = TRUE");
  }

  const hasLocation = lat !== undefined && lng !== undefined && lat !== "" && lng !== "";
  let distanceSelect = "NULL";

  if (hasLocation) {
    params.push(Number(lat));
    const latIdx = params.length;
    params.push(Number(lng));
    const lngIdx = params.length;

    distanceSelect = `(
      6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians($${latIdx})) * cos(radians(bp.latitude)) * cos(radians(bp.longitude) - radians($${lngIdx}))
          + sin(radians($${latIdx})) * sin(radians(bp.latitude))
        ))
      )
    )`;

    params.push(radiusKm ? Number(radiusKm) : DEFAULT_RADIUS_KM);
    const radiusIdx = params.length;
    conditions.push(`(bp.latitude IS NULL OR bp.longitude IS NULL OR ${distanceSelect} <= $${radiusIdx})`);
  }

  const query = `
    SELECT
      i.id AS inventory_id, i.price, i.quantity, i.last_updated,
      m.id AS medicine_id, m.brand_name, m.generic_name, m.manufacturer,
      m.dosage_form, m.strength, m.pack_size, m.is_generic,
      u.id AS wholesaler_id, u.verified,
      bp.business_name AS wholesaler_name, bp.city, bp.state,
      bp.average_rating, bp.delivery_available, bp.delivery_radius_km,
      ${distanceSelect} AS distance_km
    FROM inventory i
    JOIN medicines m ON m.id = i.medicine_id
    JOIN users u ON u.id = i.wholesaler_id AND u.role = 'WHOLESALER'
    JOIN business_profiles bp ON bp.user_id = u.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY distance_km ASC NULLS LAST, i.last_updated DESC
    LIMIT 50
  `;

  try {
    const result = await pool.query(query, params);
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Search failed" });
  }
}

async function list(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, brand_name, generic_name, manufacturer, dosage_form, strength, pack_size, is_generic FROM medicines ORDER BY generic_name, brand_name"
    );
    res.json({ success: true, medicines: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch medicines" });
  }
}

async function create(req, res) {
  const { brandName, genericName, manufacturer, dosageForm, strength, packSize, isGeneric } = req.body;

  if (!genericName || !dosageForm) {
    return res.status(400).json({ success: false, error: "genericName and dosageForm are required" });
  }
  if (!DOSAGE_FORMS.includes(dosageForm)) {
    return res.status(400).json({ success: false, error: `dosageForm must be one of ${DOSAGE_FORMS.join(", ")}` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medicines (brand_name, generic_name, manufacturer, dosage_form, strength, pack_size, is_generic)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, brand_name, generic_name, manufacturer, dosage_form, strength, pack_size, is_generic`,
      [brandName || null, genericName, manufacturer || null, dosageForm, strength || null, packSize || null, Boolean(isGeneric)]
    );
    res.status(201).json({ success: true, medicine: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create medicine" });
  }
}

async function remove(req, res) {
  try {
    await pool.query("DELETE FROM medicines WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete medicine" });
  }
}

module.exports = { search, list, create, remove, DOSAGE_FORMS };
