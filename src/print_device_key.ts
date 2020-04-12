import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid"
import Eth from "@ledgerhq/hw-app-eth"
import {formatKey} from './print_key'

const keyPath = "44'/52752'/0'/0/0"

async function run() {
  const transport = await TransportNodeHid.create()
  const eth = new Eth(transport)
  const pubKey = (await eth.getAddress(keyPath)).publicKey
  const key = ec.keyFromPublic(pubKey, 'hex')
  console.log('Hex key:')
  console.log(pubKey);
  console.log('\n')
  console.log('Formatted key:')
  console.log(formatKey(key))
}

run()
.then(() => {})
.catch((e) => console.error(e))
