import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import * as fs from 'fs'

const privKey = fs.readFileSync('key.json')
const tokens = JSON.parse(fs.readFileSync('tokens.json').toString())

const tokenBufs = []

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
  const key = ec.keyFromPrivate(privKey)
  const sig = key.sign(msgHash)
  if (!key.verify(msgHash, sig)) {
    console.log(`problem with signature`)
    process.exit(1)
  }
  const sigDer = sig.toDER()

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
