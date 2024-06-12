import blob from "../lib/data";
import { verifyData } from "./utils";

export async function verifyDataIntegrity(data: string) {
  console.log("--- BEGIN VERIFYING DATA BLOB WITH CONNECTED LEDGER ---\n");
  try {
    await verifyData(data, undefined, true);
  } catch (e) {
    console.error("Some tokens couldn't be verified");
    throw e;
  } finally {
    console.log("--- END VERIFYING DATA BLOB WITH CONNECTED LEDGER ---");
  }
}

if (require.main === module) {
  verifyDataIntegrity(blob);
}
