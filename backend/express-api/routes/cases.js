const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { auth, requireRole } = require("../middleware/auth");
const BlockchainService = require("../blockchain/service");

// Helper: record blockchain action (non-blocking, never fails the main request)
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

// ─── GET /api/cases ─────────────────────────────────────────
// Query params: status, case_type, court_id, judge_id, search, page, limit
router.get("/", auth, async (req, res) => {
  try {
    const {
      status,
      case_type,
      court_id,
      judge_id,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ["c.is_active = TRUE"];
    const params = [];

    // Writers see only their own cases
    if (req.user.role === "writer" || req.user.role === "clerk") {
      where.push("c.created_by = ?");
      params.push(req.user.user_id);
    }
    if (judge_id) {
      where.push("c.judge_id = ?");
      params.push(judge_id);
    }
    if (court_id) {
      where.push("c.court_id = ?");
      params.push(court_id);
    }
    if (case_type) {
      where.push("c.case_type = ?");
      params.push(case_type);
    }
    if (status) {
      where.push("c.current_status = ?");
      params.push(status);
    }
    if (search) {
      where.push(
        "(c.fir_text LIKE ? OR c.offense_type LIKE ? OR c.case_type LIKE ?)",
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

    const [cases] = await db.query(
      `SELECT c.*,
              co.court_name, co.location AS court_location,
              j.name AS judge_name,
              u.name AS created_by_name,
              cf.priority_cluster, cf.urgency_score, cf.severity_score
       FROM   cases c
       LEFT JOIN courts  co ON co.court_id = c.court_id
       LEFT JOIN judges  j  ON j.judge_id  = c.judge_id
       LEFT JOIN users   u  ON u.user_id   = c.created_by
       LEFT JOIN case_features cf ON cf.case_id = c.case_id
       ${whereSQL}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM cases c ${whereSQL}`,
      params,
    );

    res.json({ cases, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases ────────────────────────────────────────
router.post(
  "/",
  auth,
  requireRole("writer", "clerk", "admin"),
  async (req, res) => {
    const {
      fir_text,
      summary,
      case_type,
      offense_type,
      filing_date,
      court_id,
      legal_status,
      trial_status,
    } = req.body;

    try {
      const [result] = await db.query(
        `INSERT INTO cases
         (fir_text, summary, case_type, offense_type, filing_date,
          court_id, legal_status, trial_status, current_stage, current_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'registered', 'active', ?)`,
        [
          fir_text,
          summary,
          case_type,
          offense_type,
          filing_date || new Date().toISOString().split("T")[0],
          court_id || null,
          legal_status || "pending",
          trial_status || "not_started",
          req.user.user_id,
        ],
      );
      const caseId = result.insertId;

      // Register case log
      await db.query(
        "INSERT INTO case_registration (case_id, registered_by, registration_mode) VALUES (?, ?, ?)",
        [caseId, req.user.user_id, "manual"],
      );

      // Initial timeline entry
      await db.query(
        "INSERT INTO case_timeline (case_id, days_pending) VALUES (?, ?)",
        [caseId, 0],
      );

      // Initial case features
      await db.query(
        "INSERT INTO case_features (case_id, priority_cluster) VALUES (?, 3)",
        [caseId],
      );

      // Audit log
      await db.query(
        "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
        [
          req.user.user_id,
          caseId,
          "register",
          `Case registered by ${req.user.name}`,
        ],
      );

      // Initial history
      await db.query(
        "INSERT INTO case_history (case_id, status, remarks) VALUES (?, ?, ?)",
        [caseId, "registered", "Case created"],
      );

      // Blockchain record
      recordBlock(
        caseId,
        "case_registered",
        req.user.name,
        req.user.role,
        `New case registered (${case_type || "general"})`,
        { case_type, offense_type },
      );

      res.status(201).json({ message: "Case created.", case_id: caseId });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── GET /api/cases/:id ─────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  try {
    const caseId = req.params.id;

    const [[caseData]] = await db.query(
      `SELECT c.*,
              co.court_name, co.location AS court_location, co.court_type,
              j.name AS judge_name, j.specialization AS judge_specialization,
              u.name AS created_by_name, u.email AS created_by_email
       FROM   cases c
       LEFT JOIN courts co ON co.court_id = c.court_id
       LEFT JOIN judges j  ON j.judge_id  = c.judge_id
       LEFT JOIN users  u  ON u.user_id   = c.created_by
       WHERE c.case_id = ? AND c.is_active = TRUE`,
      [caseId],
    );
    if (!caseData) return res.status(404).json({ message: "Case not found." });

    const [persons] = await db.query(
      "SELECT * FROM persons WHERE case_id = ?",
      [caseId],
    );
    const [advocates] = await db.query(
      `SELECT a.*, ca.side FROM advocates a
       JOIN case_advocates ca ON ca.advocate_id = a.advocate_id
       WHERE ca.case_id = ?`,
      [caseId],
    );
    const [sections] = await db.query(
      `SELECT ls.* FROM legal_sections ls
       JOIN case_sections cs ON cs.section_id = ls.section_id
       WHERE cs.case_id = ?`,
      [caseId],
    );
    const [hearings] = await db.query(
      `SELECT h.*, j.name AS judge_name FROM hearings h
       LEFT JOIN judges j ON j.judge_id = h.judge_id
       WHERE h.case_id = ? ORDER BY h.hearing_date DESC`,
      [caseId],
    );
    const [schedule] = await db.query(
      `SELECT hs.*, co.court_name, j.name AS judge_name
       FROM hearing_schedule hs
       LEFT JOIN courts  co ON co.court_id = hs.court_id
       LEFT JOIN judges  j  ON j.judge_id  = hs.judge_id
       WHERE hs.case_id = ? ORDER BY hs.scheduled_date`,
      [caseId],
    );
    const [events] = await db.query(
      "SELECT * FROM case_events WHERE case_id = ? ORDER BY event_date DESC",
      [caseId],
    );
    const [history] = await db.query(
      "SELECT * FROM case_history WHERE case_id = ? ORDER BY updated_at DESC",
      [caseId],
    );
    const [detention] = await db.query(
      "SELECT * FROM detention_details WHERE case_id = ?",
      [caseId],
    );
    const [features] = await db.query(
      "SELECT * FROM case_features WHERE case_id = ?",
      [caseId],
    );
    const [judgment] = await db.query(
      "SELECT * FROM judgments WHERE case_id = ? LIMIT 1",
      [caseId],
    );
    const [timeline] = await db.query(
      "SELECT * FROM case_timeline WHERE case_id = ? LIMIT 1",
      [caseId],
    );

    res.json({
      ...caseData,
      persons,
      advocates,
      sections,
      hearings,
      schedule,
      events,
      history,
      detention: detention[0] || null,
      features: features[0] || null,
      judgment: judgment[0] || null,
      trial_data: timeline[0] || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── PUT /api/cases/:id ─────────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  const {
    fir_text,
    summary,
    case_type,
    offense_type,
    legal_status,
    trial_status,
    current_stage,
    current_status,
    judge_id,
    court_id,
    last_hearing_date,
  } = req.body;
  const caseId = req.params.id;

  try {
    const [[prev]] = await db.query(
      "SELECT current_status FROM cases WHERE case_id = ?",
      [caseId],
    );
    if (!prev) return res.status(404).json({ message: "Case not found." });

    await db.query(
      `UPDATE cases SET
         fir_text = COALESCE(?, fir_text),
         summary = COALESCE(?, summary),
         case_type = COALESCE(?, case_type),
         offense_type = COALESCE(?, offense_type),
         legal_status = COALESCE(?, legal_status),
         trial_status = COALESCE(?, trial_status),
         current_stage = COALESCE(?, current_stage),
         current_status = COALESCE(?, current_status),
         judge_id = COALESCE(?, judge_id),
         court_id = COALESCE(?, court_id),
         last_hearing_date = COALESCE(?, last_hearing_date)
       WHERE case_id = ?`,
      [
        fir_text,
        summary,
        case_type,
        offense_type,
        legal_status,
        trial_status,
        current_stage,
        current_status,
        judge_id,
        court_id,
        last_hearing_date,
        caseId,
      ],
    );

    // Log status change
    if (current_status && current_status !== prev.current_status) {
      await db.query(
        `INSERT INTO case_events
           (case_id, event_type, event_subtype, performed_by, role, description, previous_status, new_status)
         VALUES (?, 'status_change', ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          current_stage || "update",
          req.user.name,
          req.user.role,
          `Status changed to ${current_status}`,
          prev.current_status,
          current_status,
        ],
      );
      await db.query(
        "INSERT INTO case_history (case_id, status, remarks) VALUES (?, ?, ?)",
        [
          caseId,
          current_status,
          `Status updated to ${current_status} by ${req.user.name}`,
        ],
      );
    }

    await db.query(
      "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
      [req.user.user_id, caseId, "update", `Case updated by ${req.user.name}`],
    );

    // Blockchain record
    if (current_status && current_status !== prev.current_status) {
      recordBlock(
        caseId,
        "status_change",
        req.user.name,
        req.user.role,
        `Status changed from ${prev.current_status} to ${current_status}`,
        { previous: prev.current_status, new_status: current_status },
      );
    }
    if (current_stage) {
      recordBlock(
        caseId,
        "stage_change",
        req.user.name,
        req.user.role,
        `Stage updated to ${current_stage}`,
        { current_stage },
      );
    }

    res.json({ message: "Case updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── DELETE /api/cases/:id (soft delete) ────────────────────
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.query("UPDATE cases SET is_active = FALSE WHERE case_id = ?", [
      req.params.id,
    ]);

    recordBlock(
      req.params.id,
      "case_deactivated",
      req.user.name,
      req.user.role,
      `Case deactivated by ${req.user.name}`,
      {},
    );

    res.json({ message: "Case deactivated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases/:id/persons ────────────────────────────
router.post("/:id/persons", auth, async (req, res) => {
  const {
    role,
    name,
    age,
    gender,
    location,
    health_flag,
    disability_flag,
    vulnerability_score,
  } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO persons (case_id, role, name, age, gender, location, health_flag, disability_flag, vulnerability_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        role,
        name,
        age,
        gender,
        location,
        health_flag || false,
        disability_flag || false,
        vulnerability_score || 0,
      ],
    );
    res
      .status(201)
      .json({ message: "Person added.", person_id: result.insertId });

    recordBlock(
      req.params.id,
      "person_added",
      req.user.name,
      req.user.role,
      `Person "${name}" (${role}) added to case`,
      { person_id: result.insertId, role, name },
    );
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── GET /api/cases/:id/persons ─────────────────────────────
router.get("/:id/persons", auth, async (req, res) => {
  try {
    const [persons] = await db.query(
      "SELECT * FROM persons WHERE case_id = ?",
      [req.params.id],
    );
    res.json(persons);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── DELETE /api/cases/:id/persons/:pid ─────────────────────
router.delete("/:id/persons/:pid", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM persons WHERE person_id = ? AND case_id = ?", [
      req.params.pid,
      req.params.id,
    ]);

    recordBlock(
      req.params.id,
      "person_removed",
      req.user.name,
      req.user.role,
      `Person #${req.params.pid} removed from case`,
      { person_id: req.params.pid },
    );

    res.json({ message: "Person removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases/:id/sections ───────────────────────────
router.post("/:id/sections", auth, async (req, res) => {
  const { section_id } = req.body;
  try {
    await db.query(
      "INSERT IGNORE INTO case_sections (case_id, section_id) VALUES (?, ?)",
      [req.params.id, section_id],
    );

    recordBlock(
      req.params.id,
      "section_added",
      req.user.name,
      req.user.role,
      `Legal section #${section_id} added to case`,
      { section_id },
    );

    res.status(201).json({ message: "Section added." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── DELETE /api/cases/:id/sections/:sid ────────────────────
router.delete("/:id/sections/:sid", auth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM case_sections WHERE case_id = ? AND section_id = ?",
      [req.params.id, req.params.sid],
    );

    recordBlock(
      req.params.id,
      "section_removed",
      req.user.name,
      req.user.role,
      `Legal section #${req.params.sid} removed from case`,
      { section_id: req.params.sid },
    );

    res.json({ message: "Section removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases/:id/advocates ──────────────────────────
router.post(
  "/:id/advocates",
  auth,
  requireRole("judge", "admin", "writer", "clerk", "advocate"),
  async (req, res) => {
    let { advocate_id, side } = req.body;
    const caseId = req.params.id;
    try {
      // Advocates can only assign themselves
      if (req.user.role === "advocate") {
        const [advRows] = await db.query(
          "SELECT advocate_id FROM advocates WHERE user_id = ?",
          [req.user.user_id],
        );
        if (!advRows.length)
          return res
            .status(403)
            .json({ message: "Advocate profile not found." });
        advocate_id = advRows[0].advocate_id;
        // Check not already assigned
        const [existing] = await db.query(
          "SELECT 1 FROM case_advocates WHERE case_id = ? AND advocate_id = ?",
          [caseId, advocate_id],
        );
        if (existing.length)
          return res
            .status(409)
            .json({ message: "Already assigned to this case." });
      }

      await db.query(
        "INSERT IGNORE INTO case_advocates (case_id, advocate_id, side) VALUES (?, ?, ?)",
        [caseId, advocate_id, side],
      );
      await db.query(
        `INSERT INTO case_advocate_assignments (case_id, advocate_id, assigned_by, side)
       VALUES (?, ?, ?, ?)`,
        [caseId, advocate_id, req.user.user_id, side],
      );
      await db.query(
        "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
        [
          req.user.user_id,
          caseId,
          "assign_advocate",
          `Advocate assigned (${side}) by ${req.user.name}`,
        ],
      );
      // Blockchain record
      recordBlock(
        caseId,
        "advocate_assigned",
        req.user.name,
        req.user.role,
        `Advocate assigned (${side}) to case`,
        { advocate_id, side },
      );

      res.status(201).json({ message: "Advocate assigned." });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── DELETE /api/cases/:id/advocates/:aid ───────────────────
router.delete(
  "/:id/advocates/:aid",
  auth,
  requireRole("judge", "admin", "writer", "clerk"),
  async (req, res) => {
    try {
      await db.query(
        "DELETE FROM case_advocates WHERE case_id = ? AND advocate_id = ?",
        [req.params.id, req.params.aid],
      );
      await db.query(
        "UPDATE case_advocate_assignments SET status = ? WHERE case_id = ? AND advocate_id = ?",
        ["removed", req.params.id, req.params.aid],
      );

      recordBlock(
        req.params.id,
        "advocate_removed",
        req.user.name,
        req.user.role,
        `Advocate #${req.params.aid} removed from case`,
        { advocate_id: req.params.aid },
      );

      res.json({ message: "Advocate removed." });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── POST /api/cases/:id/schedule ───────────────────────────
router.post(
  "/:id/schedule",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    const {
      scheduled_date,
      time_slot,
      court_id,
      judge_id,
      scheduling_reason,
      priority_rank,
    } = req.body;
    const caseId = req.params.id;
    try {
      const [result] = await db.query(
        `INSERT INTO hearing_schedule
         (case_id, scheduled_date, time_slot, court_id, judge_id, scheduling_reason, priority_rank)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          scheduled_date,
          time_slot,
          court_id,
          judge_id,
          scheduling_reason,
          priority_rank || 0,
        ],
      );
      await db.query(
        "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
        [
          req.user.user_id,
          caseId,
          "schedule_hearing",
          `Hearing scheduled for ${scheduled_date}`,
        ],
      );
      // Blockchain record
      recordBlock(
        caseId,
        "hearing_scheduled",
        req.user.name,
        req.user.role,
        `Hearing scheduled for ${scheduled_date}`,
        { scheduled_date, time_slot },
      );

      res
        .status(201)
        .json({ message: "Hearing scheduled.", schedule_id: result.insertId });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── POST /api/cases/:id/hearings ───────────────────────────
router.post(
  "/:id/hearings",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    const {
      schedule_id,
      hearing_date,
      hearing_type,
      judge_id,
      outcome,
      next_action,
      remarks,
      actual_start_time,
      actual_end_time,
    } = req.body;
    const caseId = req.params.id;
    try {
      const [result] = await db.query(
        `INSERT INTO hearings
         (case_id, schedule_id, hearing_date, actual_start_time, actual_end_time,
          hearing_type, judge_id, outcome, next_action, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          schedule_id || null,
          hearing_date,
          actual_start_time,
          actual_end_time,
          hearing_type,
          judge_id,
          outcome,
          next_action,
          remarks,
        ],
      );

      await db.query(
        "UPDATE cases SET last_hearing_date = ? WHERE case_id = ?",
        [hearing_date, caseId],
      );

      // Update timeline
      await db.query(
        `UPDATE case_timeline
       SET number_of_trials = number_of_trials + 1
       WHERE case_id = ?`,
        [caseId],
      );

      if (schedule_id) {
        await db.query(
          "UPDATE hearing_schedule SET scheduling_status = ? WHERE schedule_id = ?",
          ["completed", schedule_id],
        );
      }

      await db.query(
        `INSERT INTO case_events
         (case_id, event_type, event_subtype, performed_by, role, description)
       VALUES (?, 'hearing', ?, ?, 'judge', ?)`,
        [
          caseId,
          outcome || "hearing_held",
          req.user.name,
          `Hearing recorded: ${outcome || "completed"}`,
        ],
      );

      // Blockchain record
      recordBlock(
        caseId,
        "hearing_completed",
        req.user.name,
        req.user.role,
        `Hearing recorded: ${outcome || "completed"}`,
        { hearing_type, outcome },
      );

      res
        .status(201)
        .json({ message: "Hearing recorded.", hearing_id: result.insertId });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── GET /api/cases/:id/hearings ────────────────────────────
router.get("/:id/hearings", auth, async (req, res) => {
  try {
    const [hearings] = await db.query(
      `SELECT h.*, j.name AS judge_name FROM hearings h
       LEFT JOIN judges j ON j.judge_id = h.judge_id
       WHERE h.case_id = ? ORDER BY h.hearing_date DESC`,
      [req.params.id],
    );
    res.json(hearings);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases/:id/judgment ───────────────────────────
router.post(
  "/:id/judgment",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    const {
      judgment_date,
      verdict,
      sentence_given_days,
      fine_amount,
      remarks,
    } = req.body;
    const caseId = req.params.id;
    try {
      const [result] = await db.query(
        `INSERT INTO judgments (case_id, judgment_date, verdict, sentence_given_days, fine_amount, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          judgment_date,
          verdict,
          sentence_given_days,
          fine_amount,
          remarks,
        ],
      );

      // Update case status to closed
      await db.query(
        "UPDATE cases SET current_status = ?, current_stage = ?, is_active = FALSE WHERE case_id = ?",
        ["closed", "judgment_delivered", caseId],
      );

      await db.query(
        `INSERT INTO case_events
         (case_id, event_type, performed_by, role, description, previous_status, new_status)
       VALUES (?, 'judgment', ?, 'judge', ?, 'active', 'closed')`,
        [caseId, req.user.name, `Verdict: ${verdict}`],
      );

      await db.query(
        "INSERT INTO case_history (case_id, status, remarks) VALUES (?, ?, ?)",
        [
          caseId,
          "judgment_delivered",
          `Verdict: ${verdict} by ${req.user.name}`,
        ],
      );

      // Blockchain record
      recordBlock(
        caseId,
        "judgment_delivered",
        req.user.name,
        req.user.role,
        `Judgment delivered — verdict: ${verdict}`,
        { verdict, sentence_given_days, fine_amount },
      );

      res
        .status(201)
        .json({ message: "Judgment recorded.", judgment_id: result.insertId });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ─── GET /api/cases/:id/events ──────────────────────────────
router.get("/:id/events", auth, async (req, res) => {
  try {
    const [events] = await db.query(
      "SELECT * FROM case_events WHERE case_id = ? ORDER BY event_date DESC",
      [req.params.id],
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── POST /api/cases/:id/detention ──────────────────────────
router.post("/:id/detention", auth, async (req, res) => {
  const { detention_days, expected_sentence_days, life_sentence_flag } =
    req.body;
  const caseId = req.params.id;
  try {
    const ratio =
      expected_sentence_days > 0
        ? parseFloat((detention_days / expected_sentence_days).toFixed(3))
        : 0;
    const overstay = ratio >= 1.0;

    const [existing] = await db.query(
      "SELECT id FROM detention_details WHERE case_id = ?",
      [caseId],
    );
    if (existing.length) {
      await db.query(
        `UPDATE detention_details
           SET detention_days = ?, expected_sentence_days = ?,
               life_sentence_flag = ?, detention_ratio = ?, overstay_flag = ?
         WHERE case_id = ?`,
        [
          detention_days,
          expected_sentence_days,
          life_sentence_flag || false,
          ratio,
          overstay,
          caseId,
        ],
      );
    } else {
      await db.query(
        `INSERT INTO detention_details
           (case_id, detention_days, expected_sentence_days, life_sentence_flag, detention_ratio, overstay_flag)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          detention_days,
          expected_sentence_days,
          life_sentence_flag || false,
          ratio,
          overstay,
        ],
      );
    }

    // Update features
    await db.query(
      `UPDATE case_features SET detention_ratio = ?, overstay_flag = ? WHERE case_id = ?`,
      [ratio, overstay, caseId],
    );

    res.json({
      message: "Detention details saved.",
      detention_ratio: ratio,
      overstay_flag: overstay,
    });

    recordBlock(
      caseId,
      "detention_updated",
      req.user.name,
      req.user.role,
      `Detention updated — ${detention_days} days, ratio ${ratio}${overstay ? " (OVERSTAY)" : ""}`,
      {
        detention_days,
        expected_sentence_days,
        detention_ratio: ratio,
        overstay_flag: overstay,
      },
    );
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─── GET /api/cases/stats/summary ───────────────────────────
router.get("/stats/summary", auth, async (req, res) => {
  try {
    let judgeFilter = "";
    const params = [];
    if (req.user.role === "judge" && req.user.judge_id) {
      judgeFilter = "WHERE judge_id = ?";
      params.push(req.user.judge_id);
    }

    const [[totals]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(is_active = TRUE)  AS active,
         SUM(current_status = 'closed') AS closed,
         SUM(current_stage  = 'registered') AS registered
       FROM cases ${judgeFilter}`,
      params,
    );

    const [byType] = await db.query(
      `SELECT case_type, COUNT(*) AS count FROM cases ${judgeFilter} GROUP BY case_type`,
      params,
    );
    const [byStatus] = await db.query(
      `SELECT current_status, COUNT(*) AS count FROM cases ${judgeFilter} GROUP BY current_status`,
      params,
    );

    res.json({ totals, byType, byStatus });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
