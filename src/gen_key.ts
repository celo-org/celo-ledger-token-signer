import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import * as fs from 'fs'

const key = ec.genKeyPair()
const privKey = key.getPrivate()

fs.writeFileSync('key.json', privKey.toBuffer())
