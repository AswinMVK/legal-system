const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { auth, requireRole } = require("../middleware/auth");

// ─── Helper: get advocate_id from logged-in user ─────────────
async function getAdvocateId(userId) {
  const [rows] = await db.query(
    "SELECT advocate_id FROM advocates WHERE user_id = ?",
    [userId],
  );
  return rows.length ? rows[0].advocate_id : null;
}

// ─── Advocate Self-Service Endpoints (must be BEFORE /:id) ───

// GET /api/advocates/me/cases
router.get(
  "/me/cases",
  auth,
  requireRole("advocate", "admin"),
  async (req, res) => {
    try {
      const advocateId = await getAdvocateId(req.user.user_id);
      if (!advocateId) return res.json({ cases: [] });

      const [cases] = await db.query(
        `SELECT c.case_id,
                CONCAT('CASE-', LPAD(c.case_id, 4, '0')) AS case_number,
                CONCAT(c.case_type, ' - ', COALESCE(c.offense_type, 'N/A')) AS case_title,
                c.case_type, c.offense_type,
                c.current_status AS status,
                c.current_stage,
                c.filing_date,
                c.fir_text,
                ca.side,
                ct.court_name,
                (SELECT cf.priority_cluster FROM case_features cf WHERE cf.case_id = c.case_id LIMIT 1) AS priority_cluster
         FROM cases c
         JOIN case_advocates ca ON ca.case_id = c.case_id
         LEFT JOIN courts ct ON ct.court_id = c.court_id
         WHERE ca.advocate_id = ? AND c.is_active = TRUE
         ORDER BY c.filing_date DESC`,
        [advocateId],
      );
      res.json({ cases });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// GET /api/advocates/me/victims
router.get(
  "/me/victims",
  auth,
  requireRole("advocate", "admin"),
  async (req, res) => {
    try {
      const advocateId = await getAdvocateId(req.user.user_id);
      if (!advocateId) return res.json({ victims: [] });

      const [victims] = await db.query(
        `SELECT p.*,
                CONCAT('CASE-', LPAD(p.case_id, 4, '0')) AS case_number
         FROM persons p
         JOIN case_advocates ca ON ca.case_id = p.case_id
         WHERE ca.advocate_id = ? AND p.role = 'victim'
         GROUP BY p.person_id
         ORDER BY p.vulnerability_score DESC`,
        [advocateId],
      );
      res.json({ victims });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// GET /api/advocates/me/requests
router.get(
  "/me/requests",
  auth,
  requireRole("advocate", "admin"),
  async (req, res) => {
    try {
      const advocateId = await getAdvocateId(req.user.user_id);
      if (!advocateId) return res.json({ requests: [] });

      const [requests] = await db.query(
        `SELECT vr.*,
                p.name AS victim_name,
                CONCAT('CASE-', LPAD(p.case_id, 4, '0')) AS case_number
         FROM victim_requests vr
         JOIN persons p ON p.person_id = vr.person_id
         WHERE vr.advocate_id = ?
         ORDER BY vr.created_at DESC`,
        [advocateId],
      );
      res.json({ requests });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// PUT /api/advocates/me/victims/:personId/notes
router.put(
  "/me/victims/:personId/notes",
  auth,
  requireRole("advocate", "admin"),
  async (req, res) => {
    try {
      const advocateId = await getAdvocateId(req.user.user_id);
      if (!advocateId)
        return res.status(403).json({ message: "Advocate profile not found." });

      const { advocate_notes } = req.body;
      await db.query(
        `INSERT INTO victim_requests (person_id, advocate_id, advocate_notes, request_type, status, created_at)
         VALUES (?, ?, ?, 'notes', 'submitted', NOW())
         ON DUPLICATE KEY UPDATE advocate_notes = VALUES(advocate_notes)`,
        [req.params.personId, advocateId, advocate_notes],
      );
      res.json({ message: "Notes updated." });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// POST /api/advocates/me/victims/:personId/requests
router.post(
  "/me/victims/:personId/requests",
  auth,
  requireRole("advocate", "admin"),
  async (req, res) => {
    try {
      const advocateId = await getAdvocateId(req.user.user_id);
      if (!advocateId)
        return res.status(403).json({ message: "Advocate profile not found." });

      const { request_type, description, urgency } = req.body;
      if (!request_type || !description) {
        return res
          .status(400)
          .json({ message: "Request type and description are required." });
      }

      await db.query(
        `INSERT INTO victim_requests (person_id, advocate_id, request_type, description, urgency, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          req.params.personId,
          advocateId,
          request_type,
          description,
          urgency || "normal",
        ],
      );
      res.status(201).json({ message: "Request submitted successfully." });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── General Advocate CRUD ──────────────────────────────────

// GET /api/advocates
router.get("/", auth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT * FROM advocates";
    const params = [];
    if (search) {
      sql += " WHERE name LIKE ? OR bar_registration_no LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [advocates] = await db.query(sql, params);
    res.json(advocates);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/advocates/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const [[adv]] = await db.query(
      "SELECT * FROM advocates WHERE advocate_id = ?",
      [req.params.id],
    );
    if (!adv) return res.status(404).json({ message: "Advocate not found." });

    const [cases] = await db.query(
      `SELECT c.case_id, c.case_type, c.offense_type, c.current_status, ca.side
       FROM cases c
       JOIN case_advocates ca ON ca.case_id = c.case_id
       WHERE ca.advocate_id = ?`,
      [req.params.id],
    );
    res.json({ ...adv, cases });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/advocates
router.post("/", auth, requireRole("judge", "admin"), async (req, res) => {
  const { name, bar_registration_no, contact_info } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO advocates (name, bar_registration_no, contact_info) VALUES (?, ?, ?)",
      [name, bar_registration_no, contact_info],
    );
    res
      .status(201)
      .json({ message: "Advocate created.", advocate_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ message: "Bar registration number already exists." });
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/advocates/:id
router.put("/:id", auth, requireRole("judge", "admin"), async (req, res) => {
  const { name, bar_registration_no, contact_info } = req.body;
  try {
    await db.query(
      `UPDATE advocates SET
         name = COALESCE(?, name),
         bar_registration_no = COALESCE(?, bar_registration_no),
         contact_info = COALESCE(?, contact_info)
       WHERE advocate_id = ?`,
      [name, bar_registration_no, contact_info, req.params.id],
    );
    res.json({ message: "Advocate updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
