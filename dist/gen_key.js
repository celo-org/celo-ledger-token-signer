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
var key = ec.genKeyPair();
var privKey = key.getPrivate();
fs.writeFileSync('key.json', privKey.toBuffer());
