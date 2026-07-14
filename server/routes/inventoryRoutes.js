const express = require("express");
const { listMine, upsert, remove } = require("../controllers/inventoryController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("WHOLESALER"));

router.get("/mine", listMine);
router.post("/", upsert);
router.delete("/:id", remove);

module.exports = router;
