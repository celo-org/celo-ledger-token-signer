import { Hex } from "@noble/curves/abstract/utils";
import blob from "../lib/data";
import { parseKey, verifyData } from "./utils";

export async function verifyDataIntegrity(data: string, pubKey: Hex) {
  console.log("--- BEGIN VERIFYING DATA BLOB WITH CONNECTED LEDGER ---\n");
  try {
    await verifyData(data, pubKey, undefined, true);
  } catch (e) {
    console.error("Some tokens couldn't be verified");
    throw e;
  } finally {
    console.log("--- END VERIFYING DATA BLOB WITH CONNECTED LEDGER ---");
  }
}

if (require.main === module) {
  const keys = parseKey("./priv-pub-key");
  verifyDataIntegrity(blob, keys.public);
}
