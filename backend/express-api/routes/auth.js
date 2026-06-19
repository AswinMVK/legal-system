const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length)
      return res.status(401).json({ message: "Invalid credentials." });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    // Fetch role-specific id
    let extraData = {};
    if (user.role === "judge") {
      const [judges] = await db.query(
        "SELECT judge_id FROM judges WHERE user_id = ?",
        [user.user_id],
      );
      if (judges.length) extraData.judge_id = judges[0].judge_id;
    } else if (user.role === "writer" || user.role === "clerk") {
      const [writers] = await db.query(
        "SELECT writer_id FROM writers WHERE user_id = ?",
        [user.user_id],
      );
      if (writers.length) extraData.writer_id = writers[0].writer_id;
    } else if (user.role === "advocate") {
      const [advocates] = await db.query(
        "SELECT advocate_id FROM advocates WHERE user_id = ?",
        [user.user_id],
      );
      if (advocates.length) extraData.advocate_id = advocates[0].advocate_id;
    }

    const payload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...extraData,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "legal_system_jwt_secret_2024",
      { expiresIn: "24h" },
    );

    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, role, phone, court_id } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });

  const allowedRoles = ["admin", "judge", "writer", "clerk", "advocate"];
  const userRole = allowedRoles.includes(role) ? role : "writer";

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, userRole, phone || null],
    );
    const userId = result.insertId;

    if (userRole === "writer" || userRole === "clerk") {
      await db.query("INSERT INTO writers (user_id, court_id) VALUES (?, ?)", [
        userId,
        court_id || null,
      ]);
    } else if (userRole === "judge" && court_id) {
      await db.query(
        "INSERT INTO judges (user_id, name, court_id) VALUES (?, ?, ?)",
        [userId, name, court_id],
      );
    } else if (userRole === "advocate") {
      const bar_reg = req.body.bar_registration_no || null;
      await db.query(
        "INSERT INTO advocates (name, user_id, bar_registration_no, contact_info) VALUES (?, ?, ?, ?)",
        [name, userId, bar_reg, email],
      );
    }

    res
      .status(201)
      .json({ message: "User registered successfully.", user_id: userId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Email already exists." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/auth/change-password
router.post("/change-password", async (req, res) => {
  const { email, old_password, new_password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "User not found." });
    const user = rows[0];
    const ok = await bcrypt.compare(old_password, user.password_hash);
    if (!ok)
      return res.status(401).json({ message: "Old password is incorrect." });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
      hash,
      user.user_id,
    ]);
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
