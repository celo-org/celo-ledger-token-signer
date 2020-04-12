import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import * as fs from 'fs'
import {formatKey} from './print_key'

const privKey = fs.readFileSync('key.json')
const key = ec.keyFromPrivate(privKey)

console.log(formatKey(key))
