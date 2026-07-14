const express = require("express");
const { search, list, create, remove } = require("../controllers/medicineController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/search", search);
router.get("/", list);
router.post("/", requireAuth, requireRole("ADMIN"), create);
router.delete("/:id", requireAuth, requireRole("ADMIN"), remove);

module.exports = router;
