import * as fs from "fs";
import { Token, formatKey, parseKsmKey, sign } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { fetchPublicKey, kmsSign } from "./config/google-cloud/kms";
import { verifyDataIntegrity } from "./verify_data_integrity";

const projectId =
  process.env.GCLOUD_PROJECT_ID || "blockchaintestsglobaltestnet";
const locationId = process.env.GCLOUD_LOCATION_ID || "europe-west9";
const keyRingId = process.env.GCLOUD_KEY_RING_ID || "Nicolas-test";
const keyId = process.env.GCLOUD_KEY_ID || "ledger-dev-test";
const versionId = process.env.GCLOUD_VERSION_ID || "1";

async function main() {
  const key = {
    projectId,
    locationId,
    keyRingId,
    keyId,
    versionId,
  };
  console.log("--- BEGIN KSM PUBLIC KEY VERIFICATION ---\n");
  const [pubKey] = await fetchPublicKey(key);
  const keys = parseKsmKey(pubKey.pem!);
  console.log("Using the private key matching the following pubkey:");
  console.log(formatKey(secp256k1.ProjectivePoint.fromHex(keys.public)));
  console.log(
    "Please make sure it matches the one in the celo-spender C application loaded onto the ledger device."
  );
  console.log("--- END KSM PUBLIC KEY VERIFICATION ---\n");

  console.log("--- BEGIN KSM SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");
  const tokens = JSON.parse(
    fs.readFileSync("./tokens.json").toString()
  ) as Token[];

  const hsmSign = async (msg: Buffer) => kmsSign(key, Buffer.from(sha256(msg)));
  const finalBuf = await sign(hsmSign, keys.public, tokens);
  console.log("BASE64 blob to be stored in the monorepo:");
  console.log(finalBuf);
  fs.writeFileSync("./lib/data.ts", `export default "${finalBuf}"`, {
    encoding: "utf8",
  });

  console.log("\n--- END KSM SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");
  if (process.env.CI) {
    console.log("CI detected, can't verify on physical device");
    process.exit(0);
  }

  await verifyDataIntegrity(finalBuf, keys.public);
}

main();
