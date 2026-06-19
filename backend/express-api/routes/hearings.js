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

// GET /api/hearings/schedule/:judgeId  — judge's upcoming schedule
router.get("/schedule/:judgeId", auth, async (req, res) => {
  try {
    const { date } = req.query;
    let sql = `
      SELECT hs.*, c.case_type, c.offense_type, c.current_status,
             co.court_name, j.name AS judge_name
      FROM   hearing_schedule hs
      JOIN   cases  c  ON c.case_id   = hs.case_id
      JOIN   courts co ON co.court_id = hs.court_id
      JOIN   judges j  ON j.judge_id  = hs.judge_id
      WHERE  hs.judge_id = ? AND hs.scheduling_status != 'cancelled'`;
    const params = [req.params.judgeId];
    if (date) {
      sql += " AND hs.scheduled_date = ?";
      params.push(date);
    }
    sql += " ORDER BY hs.scheduled_date, hs.time_slot";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/hearings/today/:judgeId
router.get("/today/:judgeId", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await db.query(
      `SELECT hs.*, c.case_type, c.offense_type, c.current_status,
              co.court_name
       FROM   hearing_schedule hs
       JOIN   cases  c  ON c.case_id   = hs.case_id
       JOIN   courts co ON co.court_id = hs.court_id
       WHERE  hs.judge_id = ? AND hs.scheduled_date = ?
       ORDER BY hs.time_slot`,
      [req.params.judgeId, today],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/hearings/:id — update hearing outcome
router.put("/:id", auth, requireRole("judge", "admin"), async (req, res) => {
  const { outcome, next_action, remarks, actual_start_time, actual_end_time } =
    req.body;
  try {
    await db.query(
      `UPDATE hearings SET
         outcome = COALESCE(?, outcome),
         next_action = COALESCE(?, next_action),
         remarks = COALESCE(?, remarks),
         actual_start_time = COALESCE(?, actual_start_time),
         actual_end_time   = COALESCE(?, actual_end_time)
       WHERE hearing_id = ?`,
      [
        outcome,
        next_action,
        remarks,
        actual_start_time,
        actual_end_time,
        req.params.id,
      ],
    );

    // Get case_id for blockchain
    const [[hearing]] = await db.query(
      "SELECT case_id FROM hearings WHERE hearing_id = ?",
      [req.params.id],
    );
    if (hearing) {
      recordBlock(
        hearing.case_id,
        "hearing_updated",
        req.user.name,
        req.user.role,
        `Hearing #${req.params.id} updated — outcome: ${outcome || "updated"}`,
        { hearing_id: req.params.id, outcome },
      );
    }

    res.json({ message: "Hearing updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/hearings/:scheduleId/reschedule
router.post(
  "/:scheduleId/reschedule",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    const { new_date, reason } = req.body;
    const scheduleId = req.params.scheduleId;
    try {
      const [[sch]] = await db.query(
        "SELECT scheduled_date FROM hearing_schedule WHERE schedule_id = ?",
        [scheduleId],
      );
      if (!sch) return res.status(404).json({ message: "Schedule not found." });

      await db.query(
        "INSERT INTO hearing_reschedule_log (schedule_id, old_date, new_date, reason, rescheduled_by) VALUES (?, ?, ?, ?, ?)",
        [scheduleId, sch.scheduled_date, new_date, reason, req.user.name],
      );

      await db.query(
        "UPDATE hearing_schedule SET scheduled_date = ?, scheduling_status = ? WHERE schedule_id = ?",
        [new_date, "rescheduled", scheduleId],
      );

      // Add adjournment
      const [[hs]] = await db.query(
        "SELECT case_id FROM hearing_schedule WHERE schedule_id = ?",
        [scheduleId],
      );
      await db.query(
        "INSERT INTO adjournments (case_id, reason, adjourned_date, next_date) VALUES (?, ?, ?, ?)",
        [hs.case_id, reason, sch.scheduled_date, new_date],
      );

      // Update timeline adjournment count
      await db.query(
        "UPDATE case_timeline SET no_of_adjournments = no_of_adjournments + 1 WHERE case_id = ?",
        [hs.case_id],
      );

      recordBlock(
        hs.case_id,
        "hearing_rescheduled",
        req.user.name,
        req.user.role,
        `Hearing rescheduled from ${sch.scheduled_date} to ${new_date} — ${reason}`,
        {
          schedule_id: scheduleId,
          old_date: sch.scheduled_date,
          new_date,
          reason,
        },
      );

      res.json({ message: "Hearing rescheduled." });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// GET /api/hearings/case/:caseId/adjournments
router.get("/case/:caseId/adjournments", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM adjournments WHERE case_id = ? ORDER BY adjourned_date DESC",
      [req.params.caseId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
