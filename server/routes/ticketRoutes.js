const express = require("express");
const { createTicket, listMine } = require("../controllers/ticketController");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", optionalAuth, createTicket);
router.get("/mine", requireAuth, listMine);

module.exports = router;
