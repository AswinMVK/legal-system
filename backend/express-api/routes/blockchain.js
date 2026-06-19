const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const BlockchainService = require("../blockchain/service");
const { ACTION_TYPES, VALID_TRANSITIONS } = require("../blockchain/config");

// GET /api/blockchain/chain — Full blockchain
router.get("/chain", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    const chain = svc.getChain();
    res.json({
      length: chain.length,
      blocks: chain.map((b) => ({
        index: b.index,
        timestamp: b.timestamp,
        hash: b.hash,
        lastHash: b.lastHash,
        nonce: b.nonce,
        difficulty: b.difficulty,
        data: b.data,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/blockchain/verify — Verify chain integrity
router.get("/verify", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    const result = svc.verifyIntegrity();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/blockchain/logs — All blockchain logs
router.get("/logs", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = await svc.getAllLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/blockchain/logs/:caseId — Logs for a specific case
router.get("/logs/:caseId", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    const logs = await svc.getCaseLogs(req.params.caseId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/blockchain/pending — Pending transactions
router.get("/pending", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    res.json(svc.getPending());
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/blockchain/transact — Submit & auto-mine a transaction
router.post("/transact", auth, async (req, res) => {
  try {
    const { caseId, actionType, description, meta } = req.body;

    if (!caseId || !actionType) {
      return res
        .status(400)
        .json({ message: "caseId and actionType are required." });
    }

    const svc = await BlockchainService.getInstance();
    const result = await svc.recordAction({
      caseId,
      actionType,
      performedBy: req.user.name,
      role: req.user.role,
      description: description || `${actionType} on case #${caseId}`,
      meta: meta || {},
    });

    if (!result.accepted) {
      return res.status(422).json({
        message: "Transaction rejected — invalid action.",
        errors: result.errors,
      });
    }

    res.status(201).json({
      message: "Transaction validated, mined and recorded on chain.",
      blockIndex: result.block.index,
      blockHash: result.block.hash,
      transactionId: result.transaction.id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// GET /api/blockchain/config — Valid action types & transitions
router.get("/config", auth, async (req, res) => {
  res.json({ actionTypes: ACTION_TYPES, validTransitions: VALID_TRANSITIONS });
});

// GET /api/blockchain/stats — Summary statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const svc = await BlockchainService.getInstance();
    const chain = svc.getChain();
    const integrity = svc.verifyIntegrity();

    const [[logStats]] = (await svc.constructor.prototype.init)
      ? [
          await require("../config/db").query(
            `SELECT COUNT(*) AS totalLogs,
                    COUNT(DISTINCT case_id) AS uniqueCases,
                    SUM(is_valid = 0) AS invalidCount
             FROM blockchain_logs`,
          ),
        ]
      : [[{ totalLogs: 0, uniqueCases: 0, invalidCount: 0 }]];

    const [recentActions] = await require("../config/db").query(
      `SELECT action_type, COUNT(*) AS count
       FROM blockchain_logs
       WHERE action_type IS NOT NULL
       GROUP BY action_type
       ORDER BY count DESC
       LIMIT 10`,
    );

    res.json({
      chainLength: chain.length,
      isValid: integrity.valid,
      issues: integrity.issues.length,
      pendingTransactions: svc.getPending().length,
      totalLogs: logStats[0]?.totalLogs || 0,
      uniqueCases: logStats[0]?.uniqueCases || 0,
      invalidCount: logStats[0]?.invalidCount || 0,
      lastBlock:
        chain.length > 0
          ? {
              index: chain[chain.length - 1].index,
              hash: chain[chain.length - 1].hash,
              timestamp: chain[chain.length - 1].timestamp,
            }
          : null,
      actionBreakdown: recentActions,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
