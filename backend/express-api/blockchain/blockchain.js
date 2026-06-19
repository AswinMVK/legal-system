const Block = require("./block");

class Blockchain {
  constructor(existingChain) {
    this.chain =
      existingChain && existingChain.length > 0
        ? existingChain
        : [Block.genesis()];
  }

  addBlock(data) {
    const block = Block.mineBlock(this.chain[this.chain.length - 1], data);
    this.chain.push(block);
    return block;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  isValidChain(chain) {
    if (!chain || chain.length === 0) return false;

    // Verify genesis block
    const genesis = Block.genesis();
    if (chain[0].hash !== genesis.hash) return false;

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];

      if (block.lastHash !== lastBlock.hash) return false;
      if (block.hash !== Block.blockHash(block)) return false;
    }
    return true;
  }

  verifyIntegrity() {
    const issues = [];
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      const lastBlock = this.chain[i - 1];

      if (block.lastHash !== lastBlock.hash) {
        issues.push({
          blockIndex: i,
          issue: "lastHash mismatch",
          expected: lastBlock.hash,
          actual: block.lastHash,
        });
      }

      const recalcHash = Block.blockHash(block);
      if (block.hash !== recalcHash) {
        issues.push({
          blockIndex: i,
          issue: "hash tampered",
          expected: recalcHash,
          actual: block.hash,
        });
      }
    }
    return {
      valid: issues.length === 0,
      totalBlocks: this.chain.length,
      issues,
    };
  }
}

module.exports = Blockchain;
