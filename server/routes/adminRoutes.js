const express = require("express");
const {
  listBusinesses,
  setVerified,
  deleteUser,
  listTickets,
  updateTicketStatus,
  analyticsSummary,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/businesses", listBusinesses);
router.patch("/businesses/:id/verify", setVerified);
router.delete("/businesses/:id", deleteUser);

router.get("/tickets", listTickets);
router.patch("/tickets/:id", updateTicketStatus);

router.get("/analytics", analyticsSummary);

module.exports = router;
