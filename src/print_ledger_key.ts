import { KEY_PATH, createTransport, formatKey } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import Eth from "@ledgerhq/hw-app-eth";

async function main() {
  const transport = await createTransport();
  const ledger = new Eth(transport);
  const pubKey = (await ledger.getAddress(KEY_PATH)).publicKey;
  const point = secp256k1.ProjectivePoint.fromHex(pubKey);

  console.log(formatKey(point));
}

main();
