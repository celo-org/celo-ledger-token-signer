import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
const Signature = require('elliptic/lib/elliptic/ec/signature')
import * as fs from 'fs'
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid"
import Eth from "@ledgerhq/hw-app-eth"

const keyPath = "44'/52752'/0'/0/0"

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const tokens = JSON.parse(fs.readFileSync('tokens.json').toString())

  const tokenBufs = []
  
  const transport = await TransportNodeHid.create()
  const eth = new Eth(transport)
  const pubKey = (await eth.getAddress(keyPath)).publicKey

  await sleep(1500)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const tickerLength = token.ticker.length

    let bufLength = 0
    bufLength += tickerLength // ticker length
    bufLength += 20 // contract address, 20 bytes
    bufLength += 4 // decimals, uint32
    bufLength += 4 // chainId, uint32

    const msg = Buffer.alloc(bufLength)

    let offset = 0

    const tickerBuf = Buffer.from(token.ticker, 'ascii')
    for (let j = 0; j < tickerLength; j++) {
      msg[offset + j] = tickerBuf[j]
    }
    offset += tickerLength
    const addressBuf = Buffer.from(token.address, 'hex')
    for (let j = 0; j < 20; j++) {
      msg[offset + j] = addressBuf[j]
    }
    offset += 20
    msg.writeUInt32BE(token.decimals, offset)
    offset += 4
    msg.writeUInt32BE(token.chainId, offset)
    offset += 4

    const msgHash = ec.hash().update(msg).digest()
    console.log(`signing token "${token.ticker}" on address ${token.address} with ${token.decimals} decimals and chain ID ${token.chainId} having message hash: ${Buffer.from(msgHash).toString('hex')}`)

    const key = ec.keyFromPublic(pubKey, 'hex')
    const sig = await eth.signPersonalMessage(keyPath, msg)
    const sigObj = new Signature({r: sig.r, s: sig.s})
    if (!key.verify(msgHash, sigObj)) {
      console.log(`problem with signature`)
      process.exit(1)
    }

    const sigDer = sigObj.toDER()
    const bufWithLengthAndSig = Buffer.alloc(4 + 1 + msg.length + sigDer.length)
    bufWithLengthAndSig.writeUInt32BE(1 + msg.length + sigDer.length, 0)
    bufWithLengthAndSig[4] = tickerLength
    for (let j = 0; j < msg.length; j++) {
      bufWithLengthAndSig[4 + 1 + j] = msg[j]
    }
    for (let j = 0; j < sigDer.length; j++) {
      bufWithLengthAndSig[4 + 1 + msg.length + j] = sigDer[j]
    }

    tokenBufs.push(bufWithLengthAndSig)
  }

  const finalBuf = Buffer.concat(tokenBufs)
  console.log(`tokens: ${finalBuf.toString('base64')}`)

}

run()
.then(() => {})
.catch((e) => console.error(e))
