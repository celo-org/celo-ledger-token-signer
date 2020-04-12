"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var elliptic_1 = require("elliptic");
var ec = new elliptic_1.ec('secp256k1');
var Signature = require('elliptic/lib/elliptic/ec/signature');
var fs = __importStar(require("fs"));
var hw_transport_node_hid_1 = __importDefault(require("@ledgerhq/hw-transport-node-hid"));
var hw_app_eth_1 = __importDefault(require("@ledgerhq/hw-app-eth"));
var keyPath = "44'/52752'/0'/0/0";
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var tokens, tokenBufs, transport, eth, pubKey, i, token, tickerLength, bufLength, msg, offset, tickerBuf, j, addressBuf, j, msgHash, key, sig, sigObj, sigDer, bufWithLengthAndSig, j, j, finalBuf;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tokens = JSON.parse(fs.readFileSync('tokens.json').toString());
                    tokenBufs = [];
                    return [4 /*yield*/, hw_transport_node_hid_1["default"].create()];
                case 1:
                    transport = _a.sent();
                    eth = new hw_app_eth_1["default"](transport);
                    return [4 /*yield*/, eth.getAddress(keyPath)];
                case 2:
                    pubKey = (_a.sent()).publicKey;
                    return [4 /*yield*/, sleep(1500)];
                case 3:
                    _a.sent();
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < tokens.length)) return [3 /*break*/, 7];
                    token = tokens[i];
                    tickerLength = token.ticker.length;
                    bufLength = 0;
                    bufLength += tickerLength; // ticker length
                    bufLength += 20; // contract address, 20 bytes
                    bufLength += 4; // decimals, uint32
                    bufLength += 4; // chainId, uint32
                    msg = Buffer.alloc(bufLength);
                    offset = 0;
                    tickerBuf = Buffer.from(token.ticker, 'ascii');
                    for (j = 0; j < tickerLength; j++) {
                        msg[offset + j] = tickerBuf[j];
                    }
                    offset += tickerLength;
                    addressBuf = Buffer.from(token.address, 'hex');
                    for (j = 0; j < 20; j++) {
                        msg[offset + j] = addressBuf[j];
                    }
                    offset += 20;
                    msg.writeUInt32BE(token.decimals, offset);
                    offset += 4;
                    msg.writeUInt32BE(token.chainId, offset);
                    offset += 4;
                    msgHash = ec.hash().update(msg).digest();
                    console.log("signing token \"" + token.ticker + "\" on address " + token.address + " with " + token.decimals + " decimals and chain ID " + token.chainId + " having message hash: " + Buffer.from(msgHash).toString('hex'));
                    key = ec.keyFromPublic(pubKey, 'hex');
                    return [4 /*yield*/, eth.signPersonalMessage(keyPath, msg)];
                case 5:
                    sig = _a.sent();
                    sigObj = new Signature({ r: sig.r, s: sig.s });
                    if (!key.verify(msgHash, sigObj)) {
                        console.log("problem with signature");
                        process.exit(1);
                    }
                    sigDer = sigObj.toDER();
                    bufWithLengthAndSig = Buffer.alloc(4 + 1 + msg.length + sigDer.length);
                    bufWithLengthAndSig.writeUInt32BE(1 + msg.length + sigDer.length, 0);
                    bufWithLengthAndSig[4] = tickerLength;
                    for (j = 0; j < msg.length; j++) {
                        bufWithLengthAndSig[4 + 1 + j] = msg[j];
                    }
                    for (j = 0; j < sigDer.length; j++) {
                        bufWithLengthAndSig[4 + 1 + msg.length + j] = sigDer[j];
                    }
                    tokenBufs.push(bufWithLengthAndSig);
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7:
                    finalBuf = Buffer.concat(tokenBufs);
                    console.log("tokens: " + finalBuf.toString('base64'));
                    return [2 /*return*/];
            }
        });
    });
}
run()
    .then(function () { })["catch"](function (e) { return console.error(e); });
