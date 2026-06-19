const ChainUtil = require("./chain-util");
const { ACTION_TYPES, VALID_TRANSITIONS } = require("./config");

class Transaction {
  constructor({ caseId, actionType, performedBy, role, description, meta }) {
    this.id = ChainUtil.id();
    this.timestamp = Date.now();
    this.caseId = caseId;
    this.actionType = actionType;
    this.performedBy = performedBy;
    this.role = role;
    this.description = description;
    this.meta = meta || {};
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return ChainUtil.hash({
      id: this.id,
      timestamp: this.timestamp,
      caseId: this.caseId,
      actionType: this.actionType,
      performedBy: this.performedBy,
      description: this.description,
      meta: this.meta,
    });
  }

  /**
   * Validate the transaction:
   *  - actionType must be in the allowed list
   *  - stage transitions must follow VALID_TRANSITIONS
   *  - required fields must exist
   */
  static validate(tx) {
    const errors = [];

    if (!tx.caseId) errors.push("caseId is required.");
    if (!tx.actionType) errors.push("actionType is required.");
    if (!tx.performedBy) errors.push("performedBy is required.");
    if (!tx.role) errors.push("role is required.");

    if (tx.actionType && !ACTION_TYPES.includes(tx.actionType)) {
      errors.push(`Invalid action type: ${tx.actionType}`);
    }

    // Validate stage transitions
    if (tx.actionType === "stage_change" && tx.meta) {
      const from = tx.meta.from_stage;
      const to = tx.meta.to_stage;
      if (from && to) {
        const allowed = VALID_TRANSITIONS[from];
        if (allowed && !allowed.includes(to)) {
          errors.push(
            `Invalid stage transition: ${from} → ${to}. Allowed: ${allowed.join(", ")}`,
          );
        }
      }
    }

    // Role-based action validation
    if (
      tx.actionType === "judgment_delivered" &&
      tx.role !== "judge" &&
      tx.role !== "admin"
    ) {
      errors.push("Only judges can deliver judgments.");
    }
    if (
      tx.actionType === "case_registered" &&
      !["writer", "clerk", "admin"].includes(tx.role)
    ) {
      errors.push("Only writers/clerks can register cases.");
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = Transaction;
