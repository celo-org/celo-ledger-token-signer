import { ec as EC } from 'elliptic'
const ec = new EC('secp256k1')
import {formatKey} from './print_key'

const pubKey = process.argv[2]
const key = ec.keyFromPublic(pubKey, 'hex')
console.log('Hex key:')
console.log(pubKey);
console.log('\n')
console.log('Formatted key:')
console.log(formatKey(key))
