import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import * as fs from 'fs'

const privKey = fs.readFileSync('key.json')
const key = ec.keyFromPrivate(privKey)
const publicKey = key.getPublic()
const x = publicKey.getX().toBuffer()
const y = publicKey.getY().toBuffer()

let xStr = ''
for (let i = 0; i < x.length; i++) {
  xStr += '0x' + x[x.length - 1 - i].toString(16) + ','
  if (i % 8 == 7) {
    xStr += '\n'
  }
}
let yStr = ''
for (let i = 0; i < y.length; i++) {
  yStr += '0x' + y[y.length - 1 - i].toString(16)
  if (i != y.length - 1) {
    yStr += ','
  }
  if (i % 8 == 7) {
    yStr += '\n'
  }
}
console.log(`0x04,\n\n${xStr}\n\n${yStr}`)
