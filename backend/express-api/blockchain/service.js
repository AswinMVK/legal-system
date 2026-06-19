const Blockchain = require("./blockchain");
const Block = require("./block");
const Transaction = require("./transaction");
const db = require("../config/db");

let instance = null;

class BlockchainService {
  constructor() {
    this.blockchain = null;
    this.pendingTransactions = [];
    this._miningLock = Promise.resolve(); // mutex for sequential mining
  }

  /* ── Singleton ── */
  static async getInstance() {
    if (!instance) {
      instance = new BlockchainService();
      await instance.init();
    }
    return instance;
  }

  /* ── Load chain from DB or create genesis ── */
  async init() {
    const [rows] = await db.query(
      "SELECT * FROM blockchain_blocks ORDER BY block_index ASC",
    );

    if (rows.length > 0) {
      const chain = rows.map((r) => {
        const b = new Block(
          Number(r.timestamp),
          r.last_hash,
          r.hash,
          typeof r.data === "string" ? JSON.parse(r.data) : r.data,
          r.nonce,
          r.difficulty,
          r.block_index,
        );
        return b;
      });
      this.blockchain = new Blockchain(chain);
    } else {
      this.blockchain = new Blockchain();
      await this.persistBlock(this.blockchain.chain[0]);
    }
  }

  /* ── Persist a single block to MySQL ── */
  async persistBlock(block) {
    await db.query(
      `INSERT INTO blockchain_blocks
       (block_index, timestamp, last_hash, hash, nonce, difficulty, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE hash = VALUES(hash)`,
      [
        block.index,
        block.timestamp,
        block.lastHash,
        block.hash,
        block.nonce,
        block.difficulty,
        JSON.stringify(block.data),
      ],
    );
  }

  /* ── Submit a new transaction (validates first) ── */
  submitTransaction({
    caseId,
    actionType,
    performedBy,
    role,
    description,
    meta,
  }) {
    const tx = new Transaction({
      caseId,
      actionType,
      performedBy,
      role,
      description,
      meta,
    });

    const validation = Transaction.validate(tx);
    if (!validation.valid) {
      return {
        accepted: false,
        errors: validation.errors,
        transaction: null,
      };
    }

    this.pendingTransactions.push(tx);
    return {
      accepted: true,
      errors: [],
      transaction: tx,
    };
  }

  /* ── Mine pending transactions into a new block ── */
  async mineBlock() {
    if (this.pendingTransactions.length === 0) {
      return { mined: false, message: "No pending transactions." };
    }

    const data = {
      transactions: this.pendingTransactions.map((tx) => ({
        id: tx.id,
        timestamp: tx.timestamp,
        caseId: tx.caseId,
        actionType: tx.actionType,
        performedBy: tx.performedBy,
        role: tx.role,
        description: tx.description,
        meta: tx.meta,
        hash: tx.hash,
      })),
      minedAt: Date.now(),
      txCount: this.pendingTransactions.length,
    };

    const block = this.blockchain.addBlock(data);
    await this.persistBlock(block);

    // Log each transaction in blockchain_logs
    for (const tx of this.pendingTransactions) {
      await db.query(
        `INSERT INTO blockchain_logs
         (case_id, block_index, case_hash, transaction_hash, action_type, performed_by, role, description, is_valid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          tx.caseId,
          block.index,
          block.hash,
          tx.hash,
          tx.actionType,
          tx.performedBy,
          tx.role,
          tx.description,
        ],
      );
    }

    const txCount = this.pendingTransactions.length;
    this.pendingTransactions = [];

    return { mined: true, block, txCount };
  }

  /* ── Auto-mine: submit + mine immediately (serialised via lock) ── */
  async recordAction({
    caseId,
    actionType,
    performedBy,
    role,
    description,
    meta,
  }) {
    // Queue behind any in-flight mine to prevent race conditions
    const job = this._miningLock.then(async () => {
      const result = this.submitTransaction({
        caseId,
        actionType,
        performedBy,
        role,
        description,
        meta,
      });

      if (!result.accepted) return result;

      const mineResult = await this.mineBlock();
      return {
        accepted: true,
        errors: [],
        transaction: result.transaction,
        block: mineResult.block,
      };
    });

    this._miningLock = job.catch(() => {}); // keep chain going even if one fails
    return job;
  }

  /* ── Get full chain ── */
  getChain() {
    return this.blockchain.chain;
  }

  /* ── Verify integrity ── */
  verifyIntegrity() {
    return this.blockchain.verifyIntegrity();
  }

  /* ── Get logs for a specific case ── */
  async getCaseLogs(caseId) {
    const [logs] = await db.query(
      `SELECT bl.*, bb.data AS block_data
       FROM blockchain_logs bl
       LEFT JOIN blockchain_blocks bb ON bb.block_index = bl.block_index
       WHERE bl.case_id = ?
       ORDER BY bl.created_at ASC`,
      [caseId],
    );
    return logs;
  }

  /* ── Get all logs ── */
  async getAllLogs(limit = 100) {
    const [logs] = await db.query(
      `SELECT bl.*,
              CONCAT('CASE-', LPAD(bl.case_id, 4, '0')) AS case_number
       FROM blockchain_logs bl
       ORDER BY bl.created_at DESC
       LIMIT ?`,
      [limit],
    );
    return logs;
  }

  /* ── Get pending transactions ── */
  getPending() {
    return this.pendingTransactions;
  }
}

module.exports = BlockchainService;
