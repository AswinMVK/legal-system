require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/persons", require("./routes/persons"));
app.use("/api/advocates", require("./routes/advocates"));
app.use("/api/hearings", require("./routes/hearings"));
app.use("/api/judges", require("./routes/judges"));
app.use("/api/courts", require("./routes/courts"));
app.use("/api/users", require("./routes/users"));
app.use("/api/blockchain", require("./routes/blockchain"));

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "express-api" }),
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Express API running on http://localhost:${PORT}`),
);
