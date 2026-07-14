const express = require("express");
const { start, listMine, getMessages, sendMessage } = require("../controllers/conversationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.post("/", requireRole("RETAILER"), start);
router.get("/mine", listMine);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);

module.exports = router;
