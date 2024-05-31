import { secp256k1 } from "@noble/curves/secp256k1";
import { formatKey, parseKey } from "./utils";

const { private: privKey, public: _pubKey } = parseKey("./priv-pub-key");

const point = secp256k1.ProjectivePoint.fromPrivateKey(privKey.slice(1)); // 00 prefixed

console.log(formatKey(point));
