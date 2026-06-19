const EC = require("elliptic").ec;
const SHA256 = require("crypto-js/sha256");
const { v4: uuidV4 } = require("uuid");

const ec = new EC("secp256k1");

class ChainUtil {
  static genKeyPair() {
    return ec.genKeyPair();
  }

  static id() {
    return uuidV4();
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }

  static verifySignature(publicKey, signature, dataHash) {
    return ec.keyFromPublic(publicKey, "hex").verify(dataHash, signature);
  }
}

module.exports = ChainUtil;
