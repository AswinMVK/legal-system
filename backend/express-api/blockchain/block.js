const ChainUtil = require("./chain-util");
const { DIFFICULTY, MINE_RATE } = require("./config");

class Block {
  constructor(timestamp, lastHash, hash, data, nonce, difficulty, index) {
    this.index = index;
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty || DIFFICULTY;
  }

  static genesis() {
    return new Block(
      Date.now(),
      "0".repeat(64),
      ChainUtil.hash("LEGAL_CMS_GENESIS_BLOCK"),
      { type: "genesis", message: "Legal CMS Blockchain Initialized" },
      0,
      DIFFICULTY,
      0,
    );
  }

  static mineBlock(lastBlock, data) {
    let hash, timestamp;
    const lastHash = lastBlock.hash;
    const index = lastBlock.index + 1;
    let { difficulty } = lastBlock;
    let nonce = 0;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty(lastBlock, timestamp);
      hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
    } while (hash.substring(0, difficulty) !== "0".repeat(difficulty));

    return new Block(timestamp, lastHash, hash, data, nonce, difficulty, index);
  }

  static hash(timestamp, lastHash, data, nonce, difficulty) {
    return ChainUtil.hash(
      `${timestamp}${lastHash}${JSON.stringify(data)}${nonce}${difficulty}`,
    );
  }

  static blockHash(block) {
    const { timestamp, lastHash, data, nonce, difficulty } = block;
    return Block.hash(timestamp, lastHash, data, nonce, difficulty);
  }

  static adjustDifficulty(lastBlock, currentTime) {
    let { difficulty } = lastBlock;
    difficulty =
      lastBlock.timestamp + MINE_RATE > currentTime
        ? difficulty + 1
        : Math.max(difficulty - 1, 1);
    return difficulty;
  }
}

module.exports = Block;
