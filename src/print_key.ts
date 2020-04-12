import { ec as EC } from 'elliptic'

export function formatKey(key: EC.KeyPair) {
  const publicKey = key.getPublic()
  const x = publicKey.getX().toBuffer()
  const y = publicKey.getY().toBuffer()


  let xStr = ''
  for (let i = 0; i < x.length; i++) {
    xStr += '0x' + x[i].toString(16) + ','
    if (i % 8 == 7) {
      xStr += '\n'
    }
  }
  let yStr = ''
  for (let i = 0; i < y.length; i++) {
    yStr += '0x' + y[i].toString(16)
    if (i != y.length - 1) {
      yStr += ','
    }
    if (i % 8 == 7) {
      yStr += '\n'
    }
  }
  return `0x04,\n\n${xStr}\n\n${yStr}`
}
