"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
exports.__esModule = true;
var elliptic_1 = require("elliptic");
var ec = new elliptic_1.ec('secp256k1');
var fs = __importStar(require("fs"));
var privKey = fs.readFileSync('key.json');
var tokens = JSON.parse(fs.readFileSync('tokens.json').toString());
var tokenStructs = [];
for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var tickerLength = token.ticker.length;
    var bufLength = 0;
    bufLength += tickerLength; // ticker length
    bufLength += 20; // contract address, 20 bytes
    bufLength += 4; // decimals, uint32
    bufLength += 4; // chainId, uint32
    var msg = Buffer.alloc(bufLength);
    var offset = 0;
    var tickerBuf = Buffer.from(token.ticker, 'ascii');
    for (var j = 0; j < tickerLength; j++) {
        msg[offset + j] = tickerBuf[j];
    }
    offset += tickerLength;
    var addressBuf = Buffer.from(token.address, 'hex');
    for (var j = 0; j < 20; j++) {
        msg[offset + j] = addressBuf[j];
    }
    offset += 20;
    msg.writeUInt32BE(token.decimals, offset);
    offset += 4;
    msg.writeUInt32BE(token.chainId, offset);
    offset += 4;
    var msgHash = ec.hash().update(msg).digest();
    var key = ec.keyFromPrivate(privKey);
    var sig = key.sign(msgHash);
    if (!key.verify(msgHash, sig)) {
        console.log("problem with signature");
        process.exit(1);
    }
    var sigDer = sig.toDER();
    var bufWithSig = Buffer.alloc(1 + msg.length + sigDer.length);
    bufWithSig[0] = tickerLength;
    for (var j = 0; j < msg.length; j++) {
        bufWithSig[1 + j] = msg[j];
    }
    for (var j = 0; j < sigDer.length; j++) {
        bufWithSig[1 + msg.length + j] = sigDer[j];
    }
    token.data = bufWithSig.toString('hex');
    tokenStructs.push(token);
}
fs.writeFileSync('signed_tokens.json', JSON.stringify(tokenStructs));
