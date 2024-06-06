import { secp256k1 } from "@noble/curves/secp256k1";
import { formatKey, parseKey } from "./utils";

const { private: _privKey, public: _pubKey } = parseKey("./priv-pub-key");
console.log(formatKey(secp256k1.ProjectivePoint.fromHex(_pubKey)));
