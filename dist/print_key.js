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
var key = ec.keyFromPrivate(privKey);
var publicKey = key.getPublic();
var x = publicKey.getX().toBuffer();
var y = publicKey.getY().toBuffer();
var xStr = '';
for (var i = 0; i < x.length; i++) {
    xStr += '0x' + x[x.length - 1 - i].toString(16) + ',';
    if (i % 8 == 7) {
        xStr += '\n';
    }
}
var yStr = '';
for (var i = 0; i < y.length; i++) {
    yStr += '0x' + y[y.length - 1 - i].toString(16);
    if (i != y.length - 1) {
        yStr += ',';
    }
    if (i % 8 == 7) {
        yStr += '\n';
    }
}
console.log("0x04,\n\n" + xStr + "\n\n" + yStr);
