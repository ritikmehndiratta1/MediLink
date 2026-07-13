require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { posthog } = require("./config/posthog");
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Medilink API is running!");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      serverTime: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function shutdown() {
  server.close();
  if (posthog) await posthog.shutdown();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
