import * as fs from "fs";
import { Token, formatKey, parseKsmKey, sign, verifyData } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex } from "@noble/curves/abstract/utils";
import { fetchPublicKey, kmsSign } from "./config/google-cloud/kms";

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

  const hsmSign = (msgHash: Hex) =>
    kmsSign(key, Buffer.from(msgHash as string, "hex"));
  const finalBuf = await sign(hsmSign, keys.public, tokens);
  console.log("BASE64 blob to be stored in the monorepo:");
  console.log(finalBuf);
  console.log("\n--- END KSM SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");

  if (process.env.CI) {
    console.log("CI detected, can't verify on physical device");
    process.exit(0);
  }

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

main();
