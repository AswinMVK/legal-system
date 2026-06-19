const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { auth, requireRole } = require("../middleware/auth");
const BlockchainService = require("../blockchain/service");

function recordBlock(caseId, actionType, performedBy, role, description, meta) {
  BlockchainService.getInstance()
    .then((svc) =>
      svc.recordAction({
        caseId,
        actionType,
        performedBy,
        role,
        description,
        meta,
      }),
    )
    .catch((err) => console.error("Blockchain record error:", err.message));
}

// GET /api/judges
router.get("/", auth, async (req, res) => {
  try {
    const [judges] = await db.query(
      `SELECT j.*, co.court_name, co.location FROM judges j
       LEFT JOIN courts co ON co.court_id = j.court_id`,
    );
    res.json(judges);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/judges/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const [[judge]] = await db.query(
      `SELECT j.*, co.court_name, co.location FROM judges j
       LEFT JOIN courts co ON co.court_id = j.court_id
       WHERE j.judge_id = ?`,
      [req.params.id],
    );
    if (!judge) return res.status(404).json({ message: "Judge not found." });
    res.json(judge);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/judges/:id/cases — cases assigned to this judge
router.get("/:id/cases", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = "c.judge_id = ? AND c.is_active = TRUE";
    const params = [req.params.id];
    if (status) {
      where += " AND c.current_status = ?";
      params.push(status);
    }

    const [cases] = await db.query(
      `SELECT c.*, co.court_name,
              cf.priority_cluster, cf.urgency_score, cf.severity_score,
              dd.detention_days, dd.overstay_flag
       FROM   cases c
       LEFT JOIN courts  co ON co.court_id = c.court_id
       LEFT JOIN case_features  cf ON cf.case_id = c.case_id
       LEFT JOIN detention_details dd ON dd.case_id = c.case_id
       WHERE  ${where}
       ORDER BY cf.urgency_score DESC, c.filing_date ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM cases c WHERE ${where}`,
      params,
    );

    res.json({ cases, total });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/judges/:id/schedule — judge schedule
router.get("/:id/schedule", auth, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = `
      SELECT hs.*, c.case_type, c.offense_type, c.current_status,
             co.court_name
      FROM   hearing_schedule hs
      JOIN   cases  c  ON c.case_id   = hs.case_id
      JOIN   courts co ON co.court_id = hs.court_id
      WHERE  hs.judge_id = ? AND hs.scheduling_status != 'cancelled'`;
    const params = [req.params.id];
    if (from_date) {
      sql += " AND hs.scheduled_date >= ?";
      params.push(from_date);
    }
    if (to_date) {
      sql += " AND hs.scheduled_date <= ?";
      params.push(to_date);
    }
    sql += " ORDER BY hs.scheduled_date, hs.time_slot";
    const [schedule] = await db.query(sql, params);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/judges — admin creates judge
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { user_id, name, court_id, experience_years, specialization } =
    req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO judges (user_id, name, court_id, experience_years, specialization) VALUES (?, ?, ?, ?, ?)",
      [user_id, name, court_id, experience_years, specialization],
    );
    res
      .status(201)
      .json({ message: "Judge created.", judge_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/judges/:id/assign-case — assign case to judge
router.put("/:id/assign-case", auth, requireRole("admin"), async (req, res) => {
  const { case_id } = req.body;
  try {
    await db.query("UPDATE cases SET judge_id = ? WHERE case_id = ?", [
      req.params.id,
      case_id,
    ]);
    await db.query(
      "INSERT INTO judge_case_assignments (case_id, judge_id, assigned_by) VALUES (?, ?, ?)",
      [case_id, req.params.id, req.user.user_id],
    );
    await db.query(
      "UPDATE judges SET active_cases = active_cases + 1 WHERE judge_id = ?",
      [req.params.id],
    );

    recordBlock(
      case_id,
      "judge_assigned",
      req.user.name,
      req.user.role,
      `Judge #${req.params.id} assigned to case`,
      { judge_id: req.params.id },
    );

    res.json({ message: "Case assigned to judge." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
