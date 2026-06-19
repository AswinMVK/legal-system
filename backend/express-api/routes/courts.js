const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { auth, requireRole } = require("../middleware/auth");

// GET /api/courts
router.get("/", auth, async (req, res) => {
  try {
    const [courts] = await db.query("SELECT * FROM courts ORDER BY court_name");
    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/courts/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const [[court]] = await db.query(
      "SELECT * FROM courts WHERE court_id = ?",
      [req.params.id],
    );
    if (!court) return res.status(404).json({ message: "Court not found." });

    const [judges] = await db.query("SELECT * FROM judges WHERE court_id = ?", [
      req.params.id,
    ]);
    res.json({ ...court, judges });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/courts
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { court_name, location, court_type } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO courts (court_name, location, court_type) VALUES (?, ?, ?)",
      [court_name, location, court_type],
    );
    res
      .status(201)
      .json({ message: "Court created.", court_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/courts/:id
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const { court_name, location, court_type } = req.body;
  try {
    await db.query(
      `UPDATE courts SET
         court_name = COALESCE(?, court_name),
         location   = COALESCE(?, location),
         court_type = COALESCE(?, court_type)
       WHERE court_id = ?`,
      [court_name, location, court_type, req.params.id],
    );
    res.json({ message: "Court updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
