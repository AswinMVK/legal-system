const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

// ── File upload config ──────────────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads", "certificates");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `cert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(
      extOk && mimeOk ? null : new Error("Only images and PDFs are allowed."),
      extOk && mimeOk,
    );
  },
});

// ═══════════════════════════════════════════════════════════
//  STATIC ROUTES (before /:id to avoid param collision)
// ═══════════════════════════════════════════════════════════

// GET /api/persons/status-updates/pending — Pending verifications (judge)
router.get(
  "/status-updates/pending",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    try {
      const [updates] = await db.query(
        `SELECT psu.*,
                p.name AS person_name, p.role AS person_role, p.age, p.gender,
                p.current_health_status,
                u.name AS submitted_by_name,
                CONCAT('CASE-', LPAD(psu.case_id, 4, '0')) AS case_number
         FROM person_status_updates psu
         JOIN persons p ON p.person_id = psu.person_id
         LEFT JOIN users u ON u.user_id = psu.submitted_by
         WHERE psu.verification_status = 'pending'
         ORDER BY
           FIELD(psu.status_type, 'deceased', 'hospitalized', 'medical', 'normal'),
           psu.created_at ASC`,
      );
      res.json(updates);
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// PUT /api/persons/status-updates/:updateId/verify — Judge verify/reject
router.put(
  "/status-updates/:updateId/verify",
  auth,
  requireRole("judge", "admin"),
  async (req, res) => {
    const { verification_status, verification_remarks } = req.body;
    const updateId = req.params.updateId;

    if (!["verified", "rejected"].includes(verification_status)) {
      return res.status(400).json({
        message: "verification_status must be 'verified' or 'rejected'.",
      });
    }

    try {
      const [[update]] = await db.query(
        "SELECT * FROM person_status_updates WHERE update_id = ?",
        [updateId],
      );
      if (!update)
        return res.status(404).json({ message: "Update not found." });

      await db.query(
        `UPDATE person_status_updates
         SET verification_status = ?, verification_remarks = ?, verified_by = ?, verified_at = NOW()
         WHERE update_id = ?`,
        [
          verification_status,
          verification_remarks || null,
          req.user.user_id,
          updateId,
        ],
      );

      if (verification_status === "verified") {
        await db.query(
          "UPDATE persons SET current_health_status = ? WHERE person_id = ?",
          [update.status_type, update.person_id],
        );

        if (update.status_type === "deceased") {
          await db.query(
            `INSERT INTO case_events
             (case_id, event_type, event_subtype, performed_by, role, description)
             VALUES (?, 'person_status', 'deceased', ?, ?, ?)`,
            [
              update.case_id,
              req.user.name,
              req.user.role,
              `Person #${update.person_id} confirmed deceased by ${req.user.name}`,
            ],
          );
        }
      }

      await db.query(
        "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
        [
          req.user.user_id,
          update.case_id,
          "verify_person_status",
          `${verification_status} status update #${updateId} for person #${update.person_id}`,
        ],
      );

      recordBlock(
        update.case_id,
        "person_status_verified",
        req.user.name,
        req.user.role,
        `Person #${update.person_id} status ${verification_status} (${update.status_type})`,
        {
          update_id: updateId,
          person_id: update.person_id,
          status_type: update.status_type,
          verification_status,
        },
      );

      res.json({ message: `Status update ${verification_status}.` });
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// ═══════════════════════════════════════════════════════════
//  PARAMETERISED ROUTES
// ═══════════════════════════════════════════════════════════

// GET /api/persons/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const [[person]] = await db.query(
      "SELECT * FROM persons WHERE person_id = ?",
      [req.params.id],
    );
    if (!person) return res.status(404).json({ message: "Person not found." });
    res.json(person);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// PUT /api/persons/:id
router.put("/:id", auth, async (req, res) => {
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
    await db.query(
      `UPDATE persons SET
         role = COALESCE(?, role),
         name = COALESCE(?, name),
         age  = COALESCE(?, age),
         gender = COALESCE(?, gender),
         location = COALESCE(?, location),
         health_flag = COALESCE(?, health_flag),
         disability_flag = COALESCE(?, disability_flag),
         vulnerability_score = COALESCE(?, vulnerability_score)
       WHERE person_id = ?`,
      [
        role,
        name,
        age,
        gender,
        location,
        health_flag,
        disability_flag,
        vulnerability_score,
        req.params.id,
      ],
    );
    res.json({ message: "Person updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// DELETE /api/persons/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM persons WHERE person_id = ?", [req.params.id]);
    res.json({ message: "Person deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  PERSON HEALTH / STATUS UPDATES
// ═══════════════════════════════════════════════════════════

// POST /api/persons/:id/status — Submit status update with certificate
router.post(
  "/:id/status",
  auth,
  requireRole("advocate", "writer", "clerk", "admin", "judge"),
  upload.single("certificate"),
  async (req, res) => {
    const personId = req.params.id;
    const { status_type, description, certificate_type, case_id } = req.body;

    if (!status_type || !case_id) {
      return res
        .status(400)
        .json({ message: "status_type and case_id are required." });
    }

    if (
      ["medical", "hospitalized", "deceased"].includes(status_type) &&
      !req.file
    ) {
      return res.status(400).json({
        message: `A ${status_type === "deceased" ? "death" : "medical"} certificate is required.`,
      });
    }

    try {
      const certPath = req.file
        ? `/uploads/certificates/${req.file.filename}`
        : null;

      const [result] = await db.query(
        `INSERT INTO person_status_updates
         (person_id, case_id, submitted_by, status_type, description, certificate_path, certificate_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          personId,
          case_id,
          req.user.user_id,
          status_type,
          description || null,
          certPath,
          certificate_type ||
            (status_type === "deceased"
              ? "death_certificate"
              : "medical_certificate"),
        ],
      );

      if (status_type === "normal") {
        await db.query(
          "UPDATE persons SET current_health_status = 'normal' WHERE person_id = ?",
          [personId],
        );
      }

      await db.query(
        "INSERT INTO user_actions (user_id, case_id, action_type, description) VALUES (?, ?, ?, ?)",
        [
          req.user.user_id,
          case_id,
          "person_status_update",
          `Status update: ${status_type} for person #${personId} by ${req.user.name}`,
        ],
      );

      res.status(201).json({
        message: "Status update submitted for verification.",
        update_id: result.insertId,
      });

      recordBlock(
        case_id,
        "person_status_update",
        req.user.name,
        req.user.role,
        `Person #${personId} status update: ${status_type}`,
        { person_id: personId, status_type, update_id: result.insertId },
      );
    } catch (err) {
      res.status(500).json({ message: "Server error.", error: err.message });
    }
  },
);

// GET /api/persons/:id/status-history
router.get("/:id/status-history", auth, async (req, res) => {
  try {
    const [updates] = await db.query(
      `SELECT psu.*,
              u.name AS submitted_by_name,
              v.name AS verified_by_name
       FROM person_status_updates psu
       LEFT JOIN users u ON u.user_id = psu.submitted_by
       LEFT JOIN users v ON v.user_id = psu.verified_by
       WHERE psu.person_id = ?
       ORDER BY psu.created_at DESC`,
      [req.params.id],
    );
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
