const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { auth, requireRole } = require("../middleware/auth");

// GET /api/users — admin only
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", auth, async (req, res) => {
  // Users can only view their own profile unless admin
  if (req.user.role !== "admin" && req.user.user_id !== parseInt(req.params.id))
    return res.status(403).json({ message: "Forbidden." });

  try {
    const [[user]] = await db.query(
      "SELECT user_id, name, email, role, phone, created_at FROM users WHERE user_id = ?",
      [req.params.id],
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.user_id !== parseInt(req.params.id))
    return res.status(403).json({ message: "Forbidden." });

  const { name, phone } = req.body;
  try {
    await db.query(
      "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE user_id = ?",
      [name, phone, req.params.id],
    );
    res.json({ message: "Profile updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// DELETE /api/users/:id — admin only
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/users/:id/actions — audit trail
router.get("/:id/actions", auth, async (req, res) => {
  try {
    const [actions] = await db.query(
      `SELECT ua.*, c.case_type, c.offense_type FROM user_actions ua
       LEFT JOIN cases c ON c.case_id = ua.case_id
       WHERE ua.user_id = ? ORDER BY ua.action_time DESC LIMIT 50`,
      [req.params.id],
    );
    res.json(actions);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/users/legal-sections/all — list all sections for case creation
router.get("/legal-sections/all", auth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT * FROM legal_sections";
    const params = [];
    if (search) {
      sql += " WHERE section LIKE ? OR description LIKE ? OR law_code LIKE ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY law_code, section";
    const [sections] = await db.query(sql, params);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
