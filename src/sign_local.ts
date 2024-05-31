import * as fs from "fs";
import { Token, formatKey, parseKey, sign, verifyData } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "@noble/curves/abstract/utils";

async function main() {
  console.log("--- BEGIN PUBLIC KEY VERIFICATION ---\n");
  const keys = parseKey("./priv-pub-key");
  console.log("Using the private key matching the following pubkey:");
  console.log(formatKey(secp256k1.ProjectivePoint.fromHex(keys.public)));
  console.log(
    "Please make sure it matches the one in the celo-spender C application loaded onto the ledger device."
  );
  console.log("--- END PUBLIC KEY VERIFICATION ---\n");

  console.log("--- BEGIN SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");
  const tokens = JSON.parse(
    fs.readFileSync("./tokens.json").toString()
  ) as Token[];

  const localSign = (msgHash: Hex) =>
    Promise.resolve(secp256k1.sign(msgHash, keys.private, { lowS: false }));
  const finalBuf = await sign(localSign, keys.public, tokens);
  console.log("BASE64 blob to be stored in the monorepo:");
  console.log(finalBuf);
  console.log("\n--- END SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");

  console.log("--- BEGIN VERIFYING DATA BLOB WITH CONNECTED LEDGER ---\n");
  try {
    await verifyData(finalBuf);
  } catch (e) {
    console.error("Some tokens couldn't be verified");
    throw e;
  } finally {
    console.log("--- END VERIFYING DATA BLOB WITH CONNECTED LEDGER ---");
  }
}

main().catch((e) => {
  console.error(e);
});
